import { writeAuditLog } from "@/lib/audit";
import type { Payload } from "payload";

// defines valid verification lifecycle states
type VerificationState =
	| "draft"
	| "pending_payment"
	| "pending_review"
	| "verified"
	| "rejected"
	| "verification_expired"
	| "blacklisted"
	| "deactivated";

// validates state transitions; throws if movement is illegal to prevent state corruption
const assertTransition = (current: VerificationState, next: VerificationState) => {
	const allowed: Record<VerificationState, VerificationState[]> = {
		draft: ["pending_payment"],
		pending_payment: ["pending_review"],
		pending_review: ["verified", "rejected", "blacklisted"],
		verified: ["verification_expired", "pending_review", "deactivated", "blacklisted"],
		rejected: ["pending_payment", "blacklisted"],
		verification_expired: ["pending_review", "deactivated"],
		deactivated: ["verified", "blacklisted"],
		// blacklisted is a terminal state — no further transitions are permitted
		blacklisted: [],
	};

	if (!allowed[current].includes(next)) {
		throw new Error(`Invalid verification transition: ${current} → ${next}`);
	}
};

// fetches account details linked to a profile for logging; returns null if lookup fails
const resolveProfileAccount = async (payload: Payload, profileId: string) => {
	try {
		const profile = await payload.findByID({
			collection: "wajakaziprofiles",
			id: profileId,
			overrideAccess: true,
		});

		const accountId =
			typeof profile?.account === "string"
				? profile.account
				: ((profile?.account as any)?.id ?? null);

		if (!accountId) return null;

		const account = await payload.findByID({
			collection: "accounts",
			id: accountId,
			overrideAccess: true,
		});

		if (!account) return null;

		const label =
			[account.firstName, account.lastName].filter(Boolean).join(" ").trim() ||
			account.email;

		return { accountId: account.id as string, label };
	} catch {
		return null;
	}
};

// initiates new verification; blocks if max rejection attempts exceeded
const submitVerification = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	if (current === "rejected") {
		const attempts = profile.verificationAttempts ?? 0;

		if (attempts >= 3) {
			throw new Error(
				"Maximum verification attempts reached. Your account cannot be resubmitted. Please contact support.",
			);
		}
	}

	assertTransition(current, "pending_payment");

	const updated = await payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "pending_payment",
			rejectionReason: null,
		},
	});

	const actor = await resolveProfileAccount(payload, profileId);

	await writeAuditLog({
		action: "verification_submitted",
		actorId: actor?.accountId ?? null,
		actorLabel: actor?.label ?? "Unknown",
		targetId: actor?.accountId ?? null,
		targetLabel: actor?.label ?? "Unknown",
		metadata: {
			profileId,
			fromStatus: current,
			toStatus: "pending_payment",
		},
		source: "user",
	});

	return updated;
};

// moves profile to review queue after payment receipt
const markPaymentCompleted = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "pending_review");

	const updated = await payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "pending_review",
			verificationSubmittedAt: new Date().toISOString(),
		},
	});

	const actor = await resolveProfileAccount(payload, profileId);

	await writeAuditLog({
		action: "verification_submitted",
		actorId: actor?.accountId ?? null,
		actorLabel: actor?.label ?? "Unknown",
		targetId: actor?.accountId ?? null,
		targetLabel: actor?.label ?? "Unknown",
		metadata: {
			profileId,
			fromStatus: current,
			toStatus: "pending_review",
			trigger: "payment_confirmed",
		},
		source: "system",
	});

	return updated;
};

// approves profile; sets expiry 1 year out
const approveVerification = async (
	payload: Payload,
	profileId: string,
	actorId: string,
	actorLabel: string,
) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "verified");

	const updated = await payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "verified",
			verificationReviewedAt: new Date().toISOString(),
			verificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
			rejectionReason: null,
		},
	});

	const target = await resolveProfileAccount(payload, profileId);

	await writeAuditLog({
		action: "verification_approved",
		actorId,
		actorLabel,
		targetId: target?.accountId ?? null,
		targetLabel: target?.label ?? "Unknown",
		metadata: {
			profileId,
			fromStatus: current,
			toStatus: "verified",
		},
		source: "user",
	});

	return updated;
};

// rejects profile and increments failure count to track abuse
const rejectVerification = async (
	payload: Payload,
	profileId: string,
	reason: string,
	actorId: string,
	actorLabel: string,
) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "rejected");

	const attempts = profile.verificationAttempts ?? 0;

	const updated = await payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "rejected",
			verificationReviewedAt: new Date().toISOString(),
			rejectionReason: reason,
			verificationAttempts: attempts + 1,
		},
	});

	const target = await resolveProfileAccount(payload, profileId);

	await writeAuditLog({
		action: "verification_rejected",
		actorId,
		actorLabel,
		targetId: target?.accountId ?? null,
		targetLabel: target?.label ?? "Unknown",
		metadata: {
			profileId,
			fromStatus: current,
			toStatus: "rejected",
			reason,
			attemptNumber: attempts + 1,
		},
		source: "user",
	});

	return updated;
};

export {
	approveVerification,
	markPaymentCompleted,
	rejectVerification,
	submitVerification,
};
