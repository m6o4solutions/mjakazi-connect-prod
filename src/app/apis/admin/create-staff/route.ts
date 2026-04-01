import { resolveIdentity } from "@/services/identity.service";
import { auth, clerkClient } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

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

	// only sa can create admin accounts
	if (identity.role !== "sa") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = await req.json();
	const { email, firstName, lastName } = body;

	if (!email || !firstName) {
		return NextResponse.json(
			{ error: "email and firstName are required" },
			{ status: 400 },
		);
	}

	try {
		const client = await clerkClient();

		// create the clerk user with admin role in publicMetadata
		// no password is set — user must set one on first login via Account Portal
		const newUser = await client.users.createUser({
			emailAddress: [email],
			firstName,
			lastName: lastName ?? "",
			password: `tmp-${crypto.randomUUID()}`,
			skipPasswordRequirement: true,
			legalAcceptedAt: new Date(),
			publicMetadata: { role: "admin" },
		});

		return NextResponse.json({
			success: true,
			clerkId: newUser.id,
		});
	} catch (error: any) {
		return NextResponse.json(
			{ error: error.errors?.[0]?.message ?? error.message },
			{ status: 400 },
		);
	}
};

export { POST };
