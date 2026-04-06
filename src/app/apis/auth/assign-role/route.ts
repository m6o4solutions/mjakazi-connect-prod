import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const VALID_PUBLIC_ROLES = ["mjakazi", "mwajiri"];

const POST = async (req: Request) => {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await req.json();
	const { role } = body;

	// only mjakazi and mwajiri can be assigned via this endpoint
	// admin and sa are assigned via clerk dashboard or sa dashboard only
	if (!role || !VALID_PUBLIC_ROLES.includes(role)) {
		return NextResponse.json({ error: "Invalid role" }, { status: 400 });
	}

	try {
		const client = await clerkClient();

		// check if role is already set — avoid overwriting an existing role
		const clerkUser = await client.users.getUser(userId);
		const existingRole = clerkUser.publicMetadata?.role;

		if (existingRole) {
			// role already assigned — do not overwrite
			return NextResponse.json({ success: true, role: existingRole });
		}

		await client.users.updateUserMetadata(userId, {
			publicMetadata: { role },
		});

		return NextResponse.json({ success: true, role });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
};

export { POST };
