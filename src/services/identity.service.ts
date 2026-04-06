import type { Payload } from "payload";

type ClerkRole = "mjakazi" | "mwajiri" | "admin" | "sa";

type VerificationState =
	| "draft"
	| "pending_payment"
	| "pending_review"
	| "verified"
	| "rejected"
	| "verification_expired"
	| "blacklisted"
	| "deactivated";

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
	verificationStatus?: VerificationState;
	subscriptionState?: string;
	wajakaziProfileId?: string;
	waajiriProfileId?: string;
}

// assembles a single identity context from the account and its linked domain profile
// used server-side wherever role, profile id, and verification/subscription state
// are all needed together — avoids repeating the same multi-collection lookup
const resolveIdentity = async (
	payload: Payload,
	clerkId: string,
): Promise<IdentityContext | null> => {
	const accountQuery = await payload.find({
		collection: "accounts",
		where: { clerkId: { equals: clerkId } },
		limit: 1,
	});

	if (accountQuery.docs.length === 0) return null;

	const account = accountQuery.docs[0];

	const identity: IdentityContext = {
		accountId: account.id,
		role: account.role,
	};

	// verificationStatus controls which paid features a worker can access
	if (account.role === "mjakazi") {
		const profile = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: account.id } },
			limit: 1,
		});

		if (profile.docs.length > 0) {
			const workerProfile = profile.docs[0];
			identity.wajakaziProfileId = workerProfile.id;
			identity.verificationStatus = workerProfile.verificationStatus;
		}
	}

	// subscriptionState is reserved for Phase 5 when employer billing is introduced
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

// these roles must be granted through a trusted server path — never accepted from user input
const PRIVILEGED_ROLES: ClerkRole[] = ["admin", "sa"];

// removes the domain profile that was created under a stale role
// necessary because user.created fires before assign-role promotes the role to publicMetadata,
// so the webhook may create a profile under the unsafeMetadata role; when user.updated arrives
// with the correct publicMetadata role, this cleans up the profile from the first pass
const cleanupOrphanedProfile = async (
	payload: Payload,
	accountId: string,
	orphanedRole: ClerkRole,
) => {
	if (orphanedRole === "mjakazi") {
		const orphaned = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: accountId } },
			overrideAccess: true,
			limit: 1,
		});

		if (orphaned.docs.length > 0) {
			await payload.delete({
				collection: "wajakaziprofiles",
				id: orphaned.docs[0].id,
				overrideAccess: true,
			});
		}
	}

	if (orphanedRole === "mwajiri") {
		const orphaned = await payload.find({
			collection: "waajiriprofiles",
			where: { account: { equals: accountId } },
			overrideAccess: true,
			limit: 1,
		});

		if (orphaned.docs.length > 0) {
			await payload.delete({
				collection: "waajiriprofiles",
				id: orphaned.docs[0].id,
				overrideAccess: true,
			});
		}
	}
};

// entry point for the Clerk user.created and user.updated webhook events
// upserts the internal account and keeps the linked domain profile in sync
const syncClerkUser = async (payload: Payload, user: ClerkUser) => {
	const clerkId = user.id;
	const email = user.email_addresses?.[0]?.email_address ?? null;
	const firstName = user.first_name ?? "";
	const lastName = user.last_name ?? "";

	const roleFromPublic = user.public_metadata?.role as ClerkRole | undefined;
	const roleFromUnsafe = user.unsafe_metadata?.role as ClerkRole | undefined;

	// unsafeMetadata is user-writable; if it carries a privileged role without a
	// matching publicMetadata entry it means the client tampered with the payload
	if (roleFromUnsafe && PRIVILEGED_ROLES.includes(roleFromUnsafe) && !roleFromPublic) {
		console.error("Privilege escalation attempt blocked:", {
			clerkId,
			roleFromUnsafe,
		});
		throw new Error("Invalid Clerk user payload.");
	}

	// publicMetadata is the authoritative source (server-writable only); unsafeMetadata
	// is the temporary fallback during the window between user.created firing and
	// the assign-role endpoint promoting the role to publicMetadata via user.updated
	const role = roleFromPublic ?? roleFromUnsafe ?? null;

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

	// fetch the existing account up front so we can detect a role change later
	const existingQuery = await payload.find({
		collection: "accounts",
		where: { clerkId: { equals: clerkId } },
		overrideAccess: true,
		limit: 1,
	});

	const existingAccount = existingQuery.docs[0] ?? null;
	const previousRole = existingAccount?.role ?? null;

	let account;

	try {
		account = await payload.create({
			collection: "accounts",
			data: { clerkId, email, firstName, lastName, role },
		});
	} catch (error: any) {
		// duplicate key means the account exists — fall back to an update
		if (!existingAccount) throw error;

		account = await payload.update({
			collection: "accounts",
			id: existingAccount.id,
			data: { email, firstName, lastName, role },
		});
	}

	// if the role changed (sign-up race resolved), remove the profile that was
	// created under the old role so the correct one can be created fresh
	if (previousRole && previousRole !== role) {
		await cleanupOrphanedProfile(payload, account.id, previousRole);
	}

	await ensureDomainProfile(payload, account.id, role, firstName, lastName);
};

// creates the role-specific domain profile if one does not already exist
// idempotent — safe to call on every sync; exits early if the profile is already present
const ensureDomainProfile = async (
	payload: Payload,
	accountId: string,
	role: ClerkRole,
	firstName?: string,
	lastName?: string,
) => {
	const derivedName = [firstName, lastName].filter(Boolean).join(" ");

	if (role === "mjakazi") {
		const existing = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: accountId } },
			overrideAccess: true,
			limit: 1,
		});

		if (existing.docs.length > 0) return;

		try {
			await payload.create({
				collection: "wajakaziprofiles",
				draft: false,
				data: {
					account: accountId,
					displayName: derivedName || "New Worker",
					verificationStatus: "draft",
					availabilityStatus: "available",
				},
			});
		} catch (error: any) {
			// two concurrent webhook deliveries can race to create the same profile —
			// swallow the duplicate error since the profile already exists
			if (!error?.message?.includes("duplicate")) throw error;
		}
	}

	if (role === "mwajiri") {
		const existing = await payload.find({
			collection: "waajiriprofiles",
			where: { account: { equals: accountId } },
			overrideAccess: true,
			limit: 1,
		});

		if (existing.docs.length > 0) return;

		try {
			await payload.create({
				collection: "waajiriprofiles",
				draft: false,
				data: {
					account: accountId,
					displayName: derivedName || "New Employer",
					moderationStatus: "active",
				},
			});
		} catch (error: any) {
			if (!error?.message?.includes("duplicate")) throw error;
		}
	}

	// admin and sa are platform-level roles with no associated domain profile
};

// handles the Clerk user.deleted webhook event
// deletes the internal account; associated domain profiles are cascaded by collection hooks
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
