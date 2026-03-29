interface VerificationProgressCardProps {
	status: string;
}

// define sequential milestones for the verification lifecycle
const steps = [
	{ id: 1, label: "Upload Documents" },
	{ id: 2, label: "Submit Verification" },
	{ id: 3, label: "Admin Review" },
];

// translate backend status strings to numeric progression indices
const stepMap: Record<string, number> = {
	draft: 0,
	pending_payment: 1,
	pending_review: 2,
	verified: 3,
	rejected: 2,
	verification_expired: 2,
};

// identify statuses that signify a permanent or critical account restriction
const terminalNegativeStates = ["blacklisted", "deactivated"];

const VerificationProgressCard = ({ status }: VerificationProgressCardProps) => {
	// handle accounts with restricted access by showing a terminal state message
	if (terminalNegativeStates.includes(status)) {
		return (
			<div className="bg-card border-border rounded-xl border p-6">
				<p className="text-muted-foreground mb-4 text-sm font-semibold">
					Verification Progress
				</p>

				<p className="text-destructive text-sm">
					Your account has been restricted. Please contact support.
				</p>
			</div>
		);
	}

	// resolve the current progress index based on the user's status
	const currentStep = stepMap[status] ?? 0;

	return (
		<div className="bg-card border-border rounded-xl border p-6">
			<p className="text-muted-foreground mb-4 text-sm font-semibold">
				Verification Progress
			</p>

			<div className="flex flex-col gap-4">
				{steps.map((step) => {
					// determine if a step is finished or active
					const complete = step.id <= currentStep;

					// flag the current step if it failed due to rejection or expiry
					const isFailed =
						(status === "rejected" || status === "verification_expired") &&
						step.id === currentStep;

					return (
						<div key={step.id} className="flex items-center gap-3">
							<div
								className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
									isFailed
										? "bg-destructive text-destructive-foreground"
										: complete
											? "bg-accent text-accent-foreground"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{step.id}
							</div>

							<span
								className={`text-sm ${
									complete ? "text-foreground" : "text-muted-foreground"
								}`}
							>
								{step.label}
							</span>
						</div>
					);
				})}
			</div>

			{/* show success message once the final verification milestone is met */}
			{status === "verified" && (
				<p className="text-accent mt-3 text-sm font-medium">
					Your profile is verified and publicly visible.
				</p>
			)}
		</div>
	);
};

export { VerificationProgressCard };
