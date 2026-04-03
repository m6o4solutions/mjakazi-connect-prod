import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// PATCH /apis/profile/update-mjakazi-profile
// updates the worker's public-facing display name and optionally their profile photo.
// photo upload is handled separately by the client (via payload's media REST endpoint);
// this route only receives the resulting media document id and links it to the profile.
const PATCH = async (req: Request) => {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		return NextResponse.json({ error: "Identity not found" }, { status: 404 });
	}

	// only mjakazi accounts have a wajakazi profile to update
	if (identity.role !== "mjakazi") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	if (!identity.wajakaziProfileId) {
		return NextResponse.json({ error: "Profile not found" }, { status: 404 });
	}

	const body = await req.json();
	const { displayName, photoId } = body;

	if (!displayName?.trim()) {
		return NextResponse.json({ error: "Display name is required." }, { status: 400 });
	}

	try {
		await payload.update({
			collection: "wajakaziprofiles",
			id: identity.wajakaziProfileId,
			overrideAccess: true,
			data: {
				displayName: displayName.trim(),
				// only update the photo relationship when a new media id is provided
				...(photoId ? { photo: photoId } : {}),
			},
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
};

export { PATCH };
