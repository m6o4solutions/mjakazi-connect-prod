import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// browsers don't always send a reliable MIME type, so fall back to file extension
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

// accepts a profile photo upload and stores it in the Payload media collection.
// restricted to authenticated mjkazi users — employers have no reason to upload photos here.
const POST = async (req: Request) => {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		return NextResponse.json({ error: "Identity not found" }, { status: 404 });
	}

	// only workers (mjakazi) have profile photos in the directory
	if (identity.role !== "mjakazi") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const formData = await req.formData();
	const file = formData.get("file") as File;

	if (!file) {
		return NextResponse.json({ error: "File missing" }, { status: 400 });
	}

	// enforce size limit before reading the buffer to avoid unnecessary memory allocation
	if (file.size > 5 * 1024 * 1024) {
		return NextResponse.json({ error: "Photo must be under 5MB." }, { status: 400 });
	}

	const mimeType = resolveMimeType(file);
	const fileBuffer = await file.arrayBuffer();

	try {
		// overrideAccess is intentional — access is already enforced above via role check
		const mediaDoc = await payload.create({
			collection: "media",
			overrideAccess: true,
			data: {
				alt: `Profile photo`,
			},
			file: {
				data: Buffer.from(fileBuffer),
				mimetype: mimeType,
				name: file.name,
				size: file.size,
			},
		});

		// return the new media document ID so the caller can link it to the worker profile
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
