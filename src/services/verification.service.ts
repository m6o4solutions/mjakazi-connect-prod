import type { Payload } from "payload";

// all possible states in the verification lifecycle
type VerificationState =
	| "draft"
	| "pending_payment"
	| "pending_review"
	| "verified"
	| "rejected"
	| "verification_expired"
	| "blacklisted"
	| "deactivated";

// guards against illegal state jumps by enforcing the allowed transition graph
// called before every update so no function can skip steps or move backwards
const assertTransition = (current: VerificationState, next: VerificationState) => {
	const allowed: Record<VerificationState, VerificationState[]> = {
		draft: ["pending_payment"],
		pending_payment: ["pending_review"],
		pending_review: ["verified", "rejected", "blacklisted"],
		// verified profiles can expire, re-enter review, or be admin-actioned
		verified: ["verification_expired", "pending_review", "deactivated", "blacklisted"],
		// rejected mjakazi can resubmit, which re-enters the payment gate
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

// mjakazi-initiated action — moves the profile to pending_payment so the payment
// gate is enforced on every submission, including resubmissions after rejection
// attempt cap is enforced here because the constraint belongs on the action the
// mjakazi takes, not on the admin rejection that sets the rejected state
const submitVerification = async (payload: Payload, profileId: string) => {
	const profile = await payload.findByID({
		collection: "wajakaziprofiles",
		id: profileId,
	});

	const current = profile.verificationStatus as VerificationState;

	// resubmission from rejected is allowed up to three times; beyond that the
	// mjakazi must contact support as their profile can no longer be processed
	if (current === "rejected") {
		const attempts = profile.verificationAttempts ?? 0;

		if (attempts >= 3) {
			throw new Error(
				"Maximum verification attempts reached. Your account cannot be resubmitted. Please contact support.",
			);
		}
	}

	assertTransition(current, "pending_payment");

	return payload.update({
		collection: "wajakaziprofiles",
		id: profileId,
		data: {
			verificationStatus: "pending_payment",
			// clear stale rejection feedback so it is not shown alongside the new submission
			rejectionReason: null,
		},
	});
};

// called by the payment webhook once the M-Pesa charge is confirmed
// moves the profile into the admin review queue and records the submission timestamp
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

// admin action that marks the worker as fully verified and sets a one-year expiry
// expiry is calculated from the moment of approval rather than submission
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
			// clear any prior rejection reason so it does not resurface in the UI
			rejectionReason: null,
		},
	});
};

// admin action that moves the profile to rejected and records mandatory feedback
// attempt counter is incremented here so the cap check in submitVerification has
// an accurate count — admins are never gated regardless of how many rejections exist
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
	approveVerification,
	markPaymentCompleted,
	rejectVerification,
	submitVerification,
};
