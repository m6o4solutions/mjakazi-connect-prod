import type { Payload } from "payload";

type ClerkRole = "mjakazi" | "mwajiri" | "admin" | "sa";

interface ClerkUser {
	id: string;
	email_addresses: { email_address: string }[];
	first_name?: string;
	last_name?: string;
	public_metadata?: { role?: ClerkRole };
	unsafe_metadata?: { role?: ClerkRole };
}

interface IdentityContext {
	accountId: string;
	role: "mjakazi" | "mwajiri" | "admin" | "sa";
	wajakaziProfileId?: string;
	waajiriProfileId?: string;
}

// retrieves the full identity context for a user including account and profile references
const resolveIdentity = async (
	payload: Payload,
	clerkId: string,
): Promise<IdentityContext | null> => {
	const accountQuery = await payload.find({
		collection: "accounts",
		where: { clerkId: { equals: clerkId } },
		limit: 1,
	});

	if (accountQuery.docs.length === 0) {
		return null;
	}

	const account = accountQuery.docs[0];

	const identity: IdentityContext = {
		accountId: account.id,
		role: account.role,
	};

	if (account.role === "mjakazi") {
		const profile = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: account.id } },
			limit: 1,
		});

		if (profile.docs.length > 0) {
			identity.wajakaziProfileId = profile.docs[0].id;
		}
	}

	if (account.role === "mwajiri") {
		const profile = await payload.find({
			collection: "waajiriprofiles",
			where: { account: { equals: account.id } },
			limit: 1,
		});

		if (profile.docs.length > 0) {
			identity.waajiriProfileId = profile.docs[0].id;
		}
	}

	return identity;
};

// synchronizes user data from Clerk into the internal accounts collection
const syncClerkUser = async (payload: Payload, user: ClerkUser) => {
	const clerkId = user.id;
	const email = user.email_addresses?.[0]?.email_address ?? null;
	const firstName = user.first_name ?? "";
	const lastName = user.last_name ?? "";

	const role =
		(user.public_metadata?.role as ClerkRole) ??
		(user.unsafe_metadata?.role as ClerkRole);

	if (!email || !role) {
		console.error("Missing email or role in Clerk payload:", {
			clerkId,
			email,
			role,
			publicMetadata: user.public_metadata,
			unsafeMetadata: user.unsafe_metadata,
		});
		throw new Error("Invalid Clerk user payload.");
	}

	const existing = await payload.find({
		collection: "accounts",
		where: { clerkId: { equals: clerkId } },
		limit: 1,
	});

	let account;

	try {
		if (existing.docs.length === 0) {
			account = await payload.create({
				collection: "accounts",
				data: { clerkId, email, firstName, lastName, role },
			});
		} else {
			account = await payload.update({
				collection: "accounts",
				id: existing.docs[0].id,
				data: { email, firstName, lastName, role },
			});
		}
	} catch (error: any) {
		console.error("Error creating/updating account:", error);
		throw new Error(`Failed to sync account: ${error.message}`);
	}

	await ensureDomainProfile(payload, account.id, role);
};

// ensures that role-specific profile records exist for the given account
const ensureDomainProfile = async (
	payload: Payload,
	accountId: string,
	role: ClerkRole,
) => {
	if (role === "mjakazi") {
		const existing = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: accountId } },
			limit: 1,
		});

		if (existing.docs.length === 0) {
			await payload.create({
				collection: "wajakaziprofiles",
				data: {
					account: accountId,
					displayName: "New Worker",
					profession: "Unspecified",
					verificationStatus: "unverified",
				},
			});
		}
	}

	if (role === "mwajiri") {
		const existing = await payload.find({
			collection: "waajiriprofiles",
			where: { account: { equals: accountId } },
			limit: 1,
		});

		if (existing.docs.length === 0) {
			await payload.create({
				collection: "waajiriprofiles",
				data: {
					account: accountId,
					displayName: "New Employer",
					moderationStatus: "active",
				},
			});
		}
	}
};

// removes an account and associated data when a user is deleted from Clerk
const deleteClerkUser = async (payload: Payload, clerkId: string) => {
	const existing = await payload.find({
		collection: "accounts",
		where: { clerkId: { equals: clerkId } },
		limit: 1,
	});

	if (existing.docs.length === 0) return;

	await payload.delete({ collection: "accounts", id: existing.docs[0].id });
};

export { deleteClerkUser, resolveIdentity, syncClerkUser };
