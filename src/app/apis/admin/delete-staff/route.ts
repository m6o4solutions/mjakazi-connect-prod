import { resolveIdentity } from "@/services/identity.service";
import { auth, clerkClient } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// only super-admins (sa) may delete staff accounts
const DELETE = async (req: Request) => {
	const { userId } = await auth();

	// reject unauthenticated requests before doing anything else
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// identity must exist in our db, not just in Clerk
	if (!identity) {
		return NextResponse.json({ error: "Identity not found" }, { status: 404 });
	}

	// only the sa role is permitted — admins cannot delete other staff
	if (identity.role !== "sa") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = await req.json();
	const { clerkId } = body;

	if (!clerkId) {
		return NextResponse.json({ error: "clerkId is required" }, { status: 400 });
	}

	// prevent an sa from accidentally removing themselves
	if (clerkId === userId) {
		return NextResponse.json(
			{ error: "You cannot delete your own account." },
			{ status: 400 },
		);
	}

	try {
		const client = await clerkClient();

		// deleting from Clerk triggers the user.deleted webhook,
		// which handles removal of the corresponding MongoDB record
		await client.users.deleteUser(clerkId);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json(
			{ error: error.errors?.[0]?.message ?? error.message },
			{ status: 400 },
		);
	}
};

export { DELETE };
