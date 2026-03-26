"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SubmitVerificationCardProps {
	verificationStatus: string;
}

// prevent re-submission or interaction when the verification process is already active or finalized
const nonSubmittableStates = [
	"pending_payment",
	"pending_review",
	"verified",
	"blacklisted",
	"deactivated",
];

// map internal status codes to user-friendly labels for the disabled button state
const buttonLabelMap: Record<string, string> = {
	pending_payment: "Awaiting Payment",
	pending_review: "Under Review",
	verified: "Verification Complete",
	blacklisted: "Account Restricted",
	deactivated: "Account Deactivated",
};

const SubmitVerificationCard = ({ verificationStatus }: SubmitVerificationCardProps) => {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const alreadySubmitted = nonSubmittableStates.includes(verificationStatus);
	const blockedLabel = buttonLabelMap[verificationStatus];

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/apis/verification/submit", { method: "POST" });

			if (res.ok) {
				setSuccess(true);
			} else {
				const data = await res.json();
				// prioritize server-returned error messages for specific failure reasons
				setError(data?.error ?? "Submission failed. Please try again.");
			}
		} catch {
			setError("Network error. Please check your connection.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
			<div>
				<p className="text-muted-foreground text-sm font-semibold">Submit Verification</p>

				<p className="text-muted-foreground text-sm">
					Once submitted, your documents will be reviewed by an administrator.
				</p>
			</div>

			{/* ensure the user cannot trigger multiple requests or resubmit based on current lifecycle status */}
			<Button onClick={handleSubmit} disabled={loading || success || alreadySubmitted}>
				{alreadySubmitted
					? blockedLabel
					: success
						? "Submitted"
						: loading
							? "Submitting..."
							: "Submit Verification"}
			</Button>

			{error && <p className="text-destructive text-sm">{error}</p>}

			{success && (
				<p className="text-accent text-sm">
					Your verification has been submitted for review.
				</p>
			)}
		</div>
	);
};

export { SubmitVerificationCard };
