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

	// converts the uploaded file into a format compatible with payload's media processing
	const payloadFile = {
		data: Buffer.from(await file.arrayBuffer()),
		filename: file.name,
		mimeType: file.type,
		name: file.name,
		size: file.size,
	};

	try {
		// creates a new entry in the vault collection, linking the file to the user's profile
		const vaultDocument = await payload.create({
			collection: "vault",
			draft: false,
			data: {
				profile: identity.wajakaziProfileId,
				uploadedBy: identity.accountId,
				documentType,
			},
			file: payloadFile as any,
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
