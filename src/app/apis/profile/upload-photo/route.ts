import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// some browsers or clients omit the mime type on the file object;
// fall back to inferring it from the file extension so payload
// receives a valid mimetype regardless of the upload client
const resolveMimeType = (file: File): string => {
	if (file.type) return file.type;
	const ext = file.name.split(".").pop()?.toLowerCase();
	const mimeMap: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
	};
	return mimeMap[ext ?? ""] ?? "image/jpeg";
};

const POST = async (req: Request) => {
	// reject requests without an authenticated Clerk session
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// identity must exist and belong to a mjakazi worker;
	// employers and other roles cannot upload profile photos here
	if (!identity) {
		return NextResponse.json({ error: "Identity not found" }, { status: 404 });
	}

	if (identity.role !== "mjakazi") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const formData = await req.formData();
	const file = formData.get("file") as File;

	// the client may pass the id of the worker's current photo so we can
	// clean it up atomically alongside creating the new upload
	const existingPhotoId = formData.get("existingPhotoId") as string | null;

	if (!file) {
		return NextResponse.json({ error: "File missing" }, { status: 400 });
	}

	// enforce the 5 MB limit on the server even though the client validates
	// it too — the client-side check can be bypassed
	if (file.size > 5 * 1024 * 1024) {
		return NextResponse.json({ error: "Photo must be under 5MB." }, { status: 400 });
	}

	const mimeType = resolveMimeType(file);
	const fileBuffer = await file.arrayBuffer();

	try {
		// delete the previous photo before uploading the new one;
		// payload.delete on an upload collection removes both the
		// mongodb record and the s3 object in a single operation
		if (existingPhotoId) {
			try {
				await payload.delete({
					collection: "media",
					id: existingPhotoId,
					overrideAccess: true,
				});
			} catch {
				// deletion failure should not block the new upload;
				// the orphaned s3 object can be cleaned up manually if needed
				console.warn("Failed to delete previous photo:", existingPhotoId);
			}
		}

		// create the new media document; payload handles the s3 upload internally
		const mediaDoc = await payload.create({
			collection: "media",
			overrideAccess: true,
			data: { alt: "Profile photo" },
			file: {
				data: Buffer.from(fileBuffer),
				mimetype: mimeType,
				name: file.name,
				size: file.size,
			},
		});

		// return the new media id so the client can attach it to the profile record
		return NextResponse.json({
			success: true,
			photoId: mediaDoc.id,
			url: mediaDoc.url,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
};

export { POST };
