import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function GET() {
	// retrieve authenticated session identifier from clerk
	const { userId } = await auth();

	// reject unauthenticated requests to protect sensitive user data
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
	}

	const payload = await getPayload({ config });

	// map external clerk user to internal payload cms identity
	const identity = await resolveIdentity(payload, userId);

	// handle cases where clerk user exists but no local identity record is found
	if (!identity) {
		return NextResponse.json({ error: "Identity not found." }, { status: 404 });
	}

	const response: Record<string, unknown> = { role: identity.role };

	// include verification status for service provider dashboard logic
	if (identity.verificationStatus) {
		response.verificationStatus = identity.verificationStatus;
	}

	// include subscription state for billing and feature access control
	if (identity.subscriptionState) {
		response.subscriptionState = identity.subscriptionState;
	}

	return NextResponse.json(response);
}
