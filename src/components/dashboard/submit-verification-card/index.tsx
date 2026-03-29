"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { ReactNode, useState } from "react";

interface SubmitVerificationCardProps {
	verificationStatus: string;
	documentsReady: boolean;
}

// states where verification has already been acted on — submission is blocked
const nonSubmittableStates = [
	"pending_payment",
	"pending_review",
	"verified",
	"blacklisted",
	"deactivated",
];

// labels shown on the button when submission is blocked by a non-submittable state
const buttonLabelMap: Record<string, string> = {
	pending_payment: "Awaiting Payment",
	pending_review: "Under Review",
	verified: "Verification Complete",
	blacklisted: "Account Restricted",
	deactivated: "Account Deactivated",
};

// maps each verification state to user-facing feedback shown in the card
const statusContextMap: Record<
	string,
	{ icon: ReactNode; message: string; tone: string }
> = {
	pending_payment: {
		icon: <Clock className="size-5 shrink-0 text-amber-500" />,
		message: "Payment is being processed. Your documents will be reviewed shortly.",
		tone: "bg-amber-50 dark:bg-amber-950/30",
	},
	pending_review: {
		icon: <Clock className="text-primary size-5 shrink-0" />,
		message: "Your documents are under admin review. We will notify you of the outcome.",
		tone: "bg-primary/5",
	},
	verified: {
		icon: <CheckCircle2 className="text-accent size-5 shrink-0" />,
		message: "Your profile is verified and publicly visible to Waajiri.",
		tone: "bg-accent/10",
	},
	rejected: {
		icon: <AlertCircle className="text-destructive size-5 shrink-0" />,
		message:
			"Your verification was rejected. Please upload corrected documents and resubmit.",
		tone: "bg-destructive/5",
	},
	verification_expired: {
		icon: <AlertCircle className="text-destructive size-5 shrink-0" />,
		message:
			"Your verification has expired. Upload a new Certificate of Good Conduct to resubmit.",
		tone: "bg-destructive/5",
	},
	blacklisted: {
		icon: <AlertCircle className="text-destructive size-5 shrink-0" />,
		message: "Your account has been restricted. Please contact support.",
		tone: "bg-destructive/5",
	},
	deactivated: {
		icon: <AlertCircle className="text-destructive size-5 shrink-0" />,
		message: "Your account has been deactivated. Please contact support.",
		tone: "bg-destructive/5",
	},
};

const SubmitVerificationCard = ({
	verificationStatus,
	documentsReady,
}: SubmitVerificationCardProps) => {
	// track submission lifecycle to drive UI feedback
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// derive whether submission is possible based on current verification state
	const alreadySubmitted = nonSubmittableStates.includes(verificationStatus);
	const blockedLabel = buttonLabelMap[verificationStatus];
	const statusContext = statusContextMap[verificationStatus];

	// disable button when mid-request, already done, in a terminal state, or docs missing
	const isDisabled = loading || success || alreadySubmitted || !documentsReady;

	// choose button text by priority: terminal state > docs missing > success > loading > default
	const buttonLabel = alreadySubmitted
		? blockedLabel
		: !documentsReady
			? "Upload documents first"
			: success
				? "Submitted"
				: loading
					? "Submitting..."
					: "Submit Verification";

	// post verification submission — surface server or network errors inline
	const handleSubmit = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/apis/verification/submit", {
				method: "POST",
			});

			if (res.ok) {
				setSuccess(true);
			} else {
				const data = await res.json();
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

			{/* shown when state provides actionable feedback to the user */}
			{statusContext && (
				<div
					className={`flex items-start gap-3 rounded-lg px-4 py-3 ${statusContext.tone}`}
				>
					{statusContext.icon}
					<p className="text-foreground text-sm leading-relaxed">
						{statusContext.message}
					</p>
				</div>
			)}

			{/* nudge user to upload required docs before they can submit */}
			{!documentsReady && !alreadySubmitted && (
				<div className="border-border bg-muted/40 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center">
					<AlertCircle className="text-muted-foreground size-5" />
					<span className="text-muted-foreground text-sm">
						Upload both documents to enable submission
					</span>
					<span className="text-muted-foreground/60 text-xs">
						National ID and Certificate of Good Conduct
					</span>
				</div>
			)}

			<Button onClick={handleSubmit} disabled={isDisabled} className="w-full gap-2">
				{buttonLabel}
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
