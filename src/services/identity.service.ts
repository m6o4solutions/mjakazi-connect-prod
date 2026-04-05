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

// builds a unified identity context for a given clerk user, combining their
// account record with any role-specific profile data needed by the application
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

	// attach worker profile id and verification status so callers can gate
	// access to features that require an approved worker account
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

	// attach employer profile id; subscription state will be added in phase 5
	// when the subscriptions collection is implemented
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

// privileged roles cannot be requested through the public sign-up flow;
// they must be set directly in the clerk dashboard or via a seed script
const PRIVILEGED_ROLES: ClerkRole[] = ["admin", "sa"];

// called by the clerk webhook on user.created and user.updated events
// writes clerk identity data into the internal accounts collection and
// ensures role-specific profiles are provisioned
const syncClerkUser = async (payload: Payload, user: ClerkUser) => {
	const clerkId = user.id;
	const email = user.email_addresses?.[0]?.email_address ?? null;
	const firstName = user.first_name ?? "";
	const lastName = user.last_name ?? "";

	// publicMetadata is written server-side only; unsafeMetadata is writable
	// by the client, so privileged roles must only come from publicMetadata
	const roleFromPublic = user.public_metadata?.role as ClerkRole | undefined;
	const roleFromUnsafe = user.unsafe_metadata?.role as ClerkRole | undefined;

	// a privileged role in unsafeMetadata without a matching publicMetadata entry
	// indicates a client-side tampering attempt — reject it outright
	if (roleFromUnsafe && PRIVILEGED_ROLES.includes(roleFromUnsafe) && !roleFromPublic) {
		console.error("Privilege escalation attempt blocked:", {
			clerkId,
			roleFromUnsafe,
		});
		throw new Error("Invalid Clerk user payload.");
	}

	// prefer the server-authoritative publicMetadata; fall back to unsafeMetadata
	// only for non-privileged roles set during the sign-up flow
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

	let account;

	try {
		account = await payload.create({
			collection: "accounts",
			data: { clerkId, email, firstName, lastName, role },
		});
	} catch (error: any) {
		// create failed — likely a duplicate; attempt an upsert instead
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

	await ensureDomainProfile(payload, account.id, role, firstName, lastName);
};

// idempotently provisions the role-specific profile record for a given account
// safe to call multiple times — duplicate errors are swallowed intentionally
const ensureDomainProfile = async (
	payload: Payload,
	accountId: string,
	role: ClerkRole,
	firstName?: string,
	lastName?: string,
) => {
	// construct the display name from clerk data; placeholder used if both are absent
	const derivedName = [firstName, lastName].filter(Boolean).join(" ");

	if (role === "mjakazi") {
		try {
			await payload.create({
				collection: "wajakaziprofiles",
				draft: false,
				data: {
					account: accountId,
					displayName: derivedName || "New Worker",
					// new workers start in draft until they complete verification
					verificationStatus: "draft",
					availabilityStatus: "available",
				},
			});
		} catch (error: any) {
			if (!error?.message?.includes("duplicate")) throw error;
		}
	}

	if (role === "mwajiri") {
		try {
			await payload.create({
				collection: "waajiriprofiles",
				draft: false,
				data: {
					account: accountId,
					displayName: derivedName || "New Employer",
					// employer profiles are active immediately upon creation
					moderationStatus: "active",
				},
			});
		} catch (error: any) {
			if (!error?.message?.includes("duplicate")) throw error;
		}
	}

	// admin and sa accounts operate without domain profiles
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
