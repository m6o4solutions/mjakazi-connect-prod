import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

const VALID_DOCUMENT_TYPES = [
	"national_id",
	"good_conduct",
	"qualification",
	"other",
] as const;

type DocumentType = (typeof VALID_DOCUMENT_TYPES)[number];

// verifies that the provided string matches one of the allowed document categories
const isValidDocumentType = (value: string): value is DocumentType => {
	return VALID_DOCUMENT_TYPES.includes(value as DocumentType);
};

// derives mime type from file extension when browser does not provide it
const resolveMimeType = (file: File): string => {
	if (file.type) return file.type;

	const ext = file.name.split(".").pop()?.toLowerCase();
	const mimeMap: Record<string, string> = {
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		pdf: "application/pdf",
	};

	return mimeMap[ext ?? ""] ?? "application/octet-stream";
};

// handles the upload and storage of worker verification documents into the secure vault
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

	// ensures that only users with a worker role can contribute to their verification vault
	if (identity.role !== "mjakazi") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	if (!identity.wajakaziProfileId) {
		return NextResponse.json({ error: "Profile not found" }, { status: 404 });
	}

	const formData = await req.formData();
	const file = formData.get("file") as File;
	const documentType = formData.get("documentType") as string;

	if (!file) {
		return NextResponse.json({ error: "File missing" }, { status: 400 });
	}

	if (!documentType || !isValidDocumentType(documentType)) {
		return NextResponse.json(
			{ error: "Invalid or missing documentType" },
			{ status: 400 },
		);
	}

	const mimeType = resolveMimeType(file);
	const fileBuffer = await file.arrayBuffer();

	try {
		// uses the local api with overrideAccess and the corrected file shape
		// payload 3.x expects "mimetype" (lowercase) not "mimeType" in the file object
		const vaultDocument = await payload.create({
			collection: "vault",
			draft: false,
			overrideAccess: true,
			data: {
				profile: identity.wajakaziProfileId,
				uploadedBy: identity.accountId,
				documentType,
			},
			file: {
				data: Buffer.from(fileBuffer),
				mimetype: mimeType,
				name: file.name,
				size: file.size,
			},
		});

		return NextResponse.json({
			success: true,
			documentId: vaultDocument.id,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
};

export { POST };
