import type { Payload } from "payload";

type VerificationState =
	| "draft"
	| "pending_payment"
	| "pending_review"
	| "verified"
	| "rejected"
	| "verification_expired"
	| "blacklisted"
	| "deactivated";

// validates that a status change follows the defined lifecycle to prevent illegal state jumps
const assertTransition = (current: VerificationState, next: VerificationState) => {
	const allowed: Record<VerificationState, VerificationState[]> = {
		draft: ["pending_payment"],
		pending_payment: ["pending_review"],
		pending_review: ["verified", "rejected", "blacklisted"],
		verified: ["verification_expired", "pending_review", "deactivated", "blacklisted"],
		rejected: ["pending_review", "blacklisted"],
		verification_expired: ["pending_review", "deactivated"],
		deactivated: ["verified", "blacklisted"],
		blacklisted: [],
	};

	if (!allowed[current].includes(next)) {
		throw new Error(`Invalid verification transition: ${current} → ${next}`);
	}
};

// worker initiates verification, moving the profile from draft to payment pending
const submitVerification = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "pending_payment");

	return payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "pending_payment",
		},
	});
};

// confirms payment was received and moves the profile into the administrative review queue
const markPaymentCompleted = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "pending_review");

	return payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "pending_review",
			verificationSubmittedAt: new Date().toISOString(),
		},
	});
};

// administrative approval that marks the worker as verified and schedules verification expiry
const approveVerification = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "verified");

	return payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "verified",
			verificationReviewedAt: new Date().toISOString(),
			verificationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
			rejectionReason: null,
		},
	});
};

// administrative rejection that moves the profile to a rejected state with mandatory feedback
const rejectVerification = async (
	payload: Payload,
	profileId: string,
	reason: string,
) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	assertTransition(current, "rejected");

	const attempts = profile.verificationAttempts ?? 0;

	if (attempts >= 3) {
		throw new Error("Maximum verification attempts reached. A new payment is required.");
	}

	return payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "rejected",
			verificationReviewedAt: new Date().toISOString(),
			rejectionReason: reason,
			verificationAttempts: attempts + 1,
		},
	});
};

export {
	submitVerification,
	markPaymentCompleted,
	approveVerification,
	rejectVerification,
};
