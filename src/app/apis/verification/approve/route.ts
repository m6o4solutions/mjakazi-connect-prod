import { resolveIdentity } from "@/services/identity.service";
import { approveVerification } from "@/services/verification.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// processes worker verification approvals initiated by administrators
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

	// restricts the approval operation to users with administrative privileges
	if (identity.role !== "admin" && identity.role !== "sa") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = await req.json();
	const { profileId } = body;

	if (!profileId) {
		return NextResponse.json({ error: "profileId required" }, { status: 400 });
	}

	try {
		// delegates the status update to the verification service to finalize the worker's verified state
		await approveVerification(payload, profileId);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}

	return NextResponse.json({ success: true });
};

export { POST };
