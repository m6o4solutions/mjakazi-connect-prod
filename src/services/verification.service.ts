import { writeAuditLog } from "@/lib/audit";
import type { Payload } from "payload";

// all states a wajakazi profile can occupy in the verification lifecycle
type VerificationState =
	| "draft"
	| "pending_payment"
	| "pending_review"
	| "verified"
	| "rejected"
	| "verification_expired"
	| "blacklisted"
	| "deactivated";

// enforces the allowed state machine transitions so no code path can
// move a profile to an illegal state; throws early to surface misuse
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

// resolves the account linked to a wajakazi profile to obtain a human-readable
// actor label for audit logs; returns null gracefully so callers handle the
// absence without crashing the primary operation
const resolveProfileAccount = async (payload: Payload, profileId: string) => {
	try {
		const profile = await payload.findByID({
			collection: "wajakaziprofiles",
			id: profileId,
			overrideAccess: true,
		});

		// the account field may be populated or a bare id string depending on depth
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

		// prefer full name; fall back to email if name fields are empty
		const label =
			[account.firstName, account.lastName].filter(Boolean).join(" ").trim() ||
			account.email;

		return { accountId: account.id as string, label };
	} catch {
		return null;
	}
};

// initiates a new verification request by moving the profile to pending_payment;
// resubmissions from a rejected state are capped at 3 attempts to prevent abuse
const submitVerification = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	if (current === "rejected") {
		const attempts = profile.verificationAttempts ?? 0;

		// hard cap after 3 failed attempts; the user must contact support to proceed
		if (attempts >= 3) {
			throw new Error(
				"Maximum verification attempts reached. Your account cannot be resubmitted. Please contact support.",
			);
		}
	}

	assertTransition(current, "pending_payment");

	// clear any previous rejection reason so stale messaging doesn't surface
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

// advances the profile to pending_review once payment is confirmed;
// records the submission timestamp so reviewers can track queue age
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
			// distinguishes this system-triggered entry from the user-initiated submission above
			trigger: "payment_confirmed",
		},
		source: "system",
	});

	return updated;
};

// marks a profile as verified and sets a 1-year expiry from the review date;
// actorId and actorLabel come from the caller, which has already resolved the
// authenticated admin or sa identity — this service does not re-resolve them
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
			// expiry is fixed at 365 days from approval; the profile must re-verify after this
			verificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
			rejectionReason: null,
		},
	});

	// target is the mjakazi whose profile was approved, distinct from the admin actor
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

// rejects a profile and increments the attempt counter so the 3-attempt cap in
// submitVerification can be enforced on the next resubmission
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

	// read the current attempt count before updating so the increment is consistent
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
			// record which attempt this rejection corresponds to for support triage
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
