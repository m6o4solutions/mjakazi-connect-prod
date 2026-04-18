import { resolveIdentity } from "@/services/identity.service";
import { rejectVerification } from "@/services/verification.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

const POST = async (req: Request) => {
	// only authenticated users may trigger this action
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config });

	// fetch the unified identity to confirm the caller has an admin or sa role
	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		return NextResponse.json({ error: "Identity not found" }, { status: 404 });
	}

	// verification rejections are restricted to admin and sa roles only
	if (identity.role !== "admin" && identity.role !== "sa") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = await req.json();
	const { profileId, reason } = body;

	// reason is mandatory — it is stored on the profile and surfaced to the mjakazi
	if (!profileId || !reason) {
		return NextResponse.json({ error: "profileId and reason required" }, { status: 400 });
	}

	// resolve the admin's account record to build a human-readable actor label
	// for the audit log; the service receives the label rather than re-resolving it
	const actorQuery = await payload.find({
		collection: "accounts",
		where: { clerkId: { equals: userId } },
		overrideAccess: true,
		limit: 1,
	});

	const actor = actorQuery.docs[0] ?? null;
	// prefer full name; fall back to email, then clerk id if account is missing
	const actorLabel = actor
		? [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() || actor.email
		: userId;

	try {
		await rejectVerification(payload, profileId, reason, identity.accountId, actorLabel);
	} catch (error: any) {
		// service throws for invalid state transitions or missing profiles
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	return NextResponse.json({ success: true });
};

export { POST };
