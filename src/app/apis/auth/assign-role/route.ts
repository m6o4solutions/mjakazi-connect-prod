import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// privileged roles (admin, sa) are intentionally excluded — they must be granted
// through the Clerk dashboard or a trusted seed script to prevent self-escalation
const VALID_PUBLIC_ROLES = ["mjakazi", "mwajiri"];

// allows an authenticated user to self-assign one of the permitted public roles
// called once after sign-up, before the user reaches the main application
const POST = async (req: Request) => {
	// reject unauthenticated callers before touching any external service
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await req.json();
	const { role } = body;

	// reject missing or out-of-allowlist roles early to avoid unnecessary Clerk calls
	if (!role || !VALID_PUBLIC_ROLES.includes(role)) {
		return NextResponse.json({ error: "Invalid role" }, { status: 400 });
	}

	try {
		const client = await clerkClient();

		// read the current user before writing to avoid overwriting a role that was
		// already committed — guards against duplicate requests and UI retries
		const clerkUser = await client.users.getUser(userId);
		const existingRole = clerkUser.publicMetadata?.role;

		if (existingRole) {
			// role already set — return it unchanged rather than re-writing
			return NextResponse.json({ success: true, role: existingRole });
		}

		// promote the role to publicMetadata (server-writable only) and wipe
		// unsafeMetadata so the webhook handler uses publicMetadata as the single
		// authoritative source when creating the internal account and domain profile
		await client.users.updateUserMetadata(userId, {
			publicMetadata: { role },
			unsafeMetadata: {},
		});

		return NextResponse.json({ success: true, role });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
};

export { POST };
