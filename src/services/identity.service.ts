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
		(user.unsafe_metadata?.role as ClerkRole) ??
		null;

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

	let account;

	try {
		account = await payload.create({
			collection: "accounts",
			data: { clerkId, email, firstName, lastName, role },
		});
	} catch (error: any) {
		// duplicate key error → account already exists
		const existing = await payload.find({
			collection: "accounts",
			where: { clerkId: { equals: clerkId } },
			limit: 1,
		});

		if (existing.docs.length === 0) throw error;

		account = await payload.update({
			collection: "accounts",
			id: existing.docs[0].id,
			data: { email, firstName, lastName, role },
		});
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
		try {
			await payload.create({
				collection: "wajakaziprofiles",
				data: {
					account: accountId,
					displayName: "New Worker",
					profession: "Unspecified",
					verificationStatus: "draft",
					availabilityStatus: "available",
				},
			});
		} catch (error: any) {
			// duplicate profile already exists → ignore
			if (!error?.message?.includes("duplicate")) {
				throw error;
			}
		}
	}

	if (role === "mwajiri") {
		try {
			await payload.create({
				collection: "waajiriprofiles",
				data: {
					account: accountId,
					displayName: "New Employer",
					moderationStatus: "active",
				},
			});
		} catch (error: any) {
			// duplicate profile already exists → ignore
			if (!error?.message?.includes("duplicate")) {
				throw error;
			}
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

	await payload.delete({
		collection: "accounts",
		id: existing.docs[0].id,
	});
};

export { deleteClerkUser, resolveIdentity, syncClerkUser };
