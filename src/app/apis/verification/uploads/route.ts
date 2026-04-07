import { generateUniqueFilename } from "@/lib/generate-unique-filename";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// defines the accepted verification document categories; anything outside
// this set is rejected to prevent arbitrary data being stored in the vault
const VALID_DOCUMENT_TYPES = [
	"national_id",
	"good_conduct",
	"qualification",
	"other",
] as const;

type DocumentType = (typeof VALID_DOCUMENT_TYPES)[number];

const isValidDocumentType = (value: string): value is DocumentType => {
	return VALID_DOCUMENT_TYPES.includes(value as DocumentType);
};

// some browsers and http clients omit file.type; fall back to the extension
// so payload always receives a usable mime type
const resolveMimeType = (file: File): string => {
	if (file.type) return file.type;

	const ext = file.name.split(".").pop()?.toLowerCase();
	const mimeMap: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		pdf: "application/pdf",
	};

	// octet-stream is the safest generic fallback when the type is truly unknown
	return mimeMap[ext ?? ""] ?? "application/octet-stream";
};

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

	// verification documents are only relevant to mjakazi workers
	if (identity.role !== "mjakazi") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// a profile must already exist before documents can be attached to it
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

	// each document type may only appear once per profile; uploading again
	// requires the client to delete the existing entry first
	const existingDoc = await payload.find({
		collection: "vault",
		where: {
			and: [
				{ profile: { equals: identity.wajakaziProfileId } },
				{ documentType: { equals: documentType } },
			],
		},
		overrideAccess: true,
		limit: 1,
	});

	if (existingDoc.totalDocs >= 1) {
		return NextResponse.json(
			{ error: "A document of this type has already been uploaded." },
			{ status: 400 },
		);
	}

	const mimeType = resolveMimeType(file);
	const fileBuffer = await file.arrayBuffer();
	const uniqueFilename = generateUniqueFilename(file.name);

	try {
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
				name: uniqueFilename,
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
