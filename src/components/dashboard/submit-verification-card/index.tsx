"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

interface SubmitVerificationCardProps {
	verificationStatus: string;
	documentsReady: boolean;
}

// once verification has been acted on, re-submission must be blocked to
// prevent duplicate entries and accidental payment triggers
const nonSubmittableStates = [
	"pending_payment",
	"pending_review",
	"verified",
	"blacklisted",
	"deactivated",
];

// each blocked state gets a distinct label so the user understands why
// the button is inert rather than encountering a generic disabled state
const buttonLabelMap: Record<string, string> = {
	pending_payment: "Awaiting Payment",
	pending_review: "Under Review",
	verified: "Verification Complete",
	blacklisted: "Account Restricted",
	deactivated: "Account Deactivated",
};

// drives the contextual feedback banner; covers both terminal states
// (verified, blacklisted) and recoverable ones (rejected, expired) so
// the user always knows what happened and what action, if any, is needed
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
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const alreadySubmitted = nonSubmittableStates.includes(verificationStatus);
	const blockedLabel = buttonLabelMap[verificationStatus];
	const statusContext = statusContextMap[verificationStatus];

	// aggregates every condition that makes submission pointless or harmful
	const isDisabled = loading || success || alreadySubmitted || !documentsReady;

	// priority order reflects what the user most needs to see at each stage:
	// terminal state > missing docs (actionable) > success > loading > default
	const buttonLabel = alreadySubmitted
		? blockedLabel
		: !documentsReady
			? "Upload Required Documents"
			: success
				? "Submitted"
				: loading
					? "Submitting..."
					: "Submit Verification";

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/apis/verification/submit", {
				method: "POST",
			});

			if (res.ok) {
				setSuccess(true);
				// re-fetch server component data so the PaymentCard becomes visible
				// immediately without a manual page reload
				router.refresh();
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

			{/* only rendered when the current state has contextual feedback to show */}
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

			{/* shown when submission is still possible but documents are missing —
			    gives the user a clear next step rather than a silent disabled button */}
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
