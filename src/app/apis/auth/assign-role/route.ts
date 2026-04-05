import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// public sign-up flow only supports these two roles
// privileged roles (admin, sa) must be assigned outside this endpoint
const VALID_PUBLIC_ROLES = ["mjakazi", "mwajiri"];

const POST = async (req: Request) => {
	// require an active clerk session — anonymous requests are rejected
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await req.json();
	const { role } = body;

	if (!role || !VALID_PUBLIC_ROLES.includes(role)) {
		return NextResponse.json({ error: "Invalid role" }, { status: 400 });
	}

	try {
		const client = await clerkClient();

		// fetch the current user to check whether a role is already persisted
		const clerkUser = await client.users.getUser(userId);
		const existingRole = clerkUser.publicMetadata?.role;

		// roles are immutable once set — a second sign-up attempt should not
		// be able to overwrite an existing role
		if (existingRole) {
			return NextResponse.json({ success: true, role: existingRole });
		}

		// write role to publicMetadata, which is server-writable only
		// this prevents the client from spoofing a different role later
		await client.users.updateUserMetadata(userId, {
			publicMetadata: { role },
		});

		return NextResponse.json({ success: true, role });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
};

export { POST };
