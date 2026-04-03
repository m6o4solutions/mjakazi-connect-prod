import { DashboardTopbar } from "@/components/dashboard/topbar";
import { VerificationProgressCard } from "@/components/dashboard/verification-progress-card";
import { VerificationStatusCard } from "@/components/dashboard/verification-status-card";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

// statuses where the verification CTA should be shown
const INCOMPLETE_STATUSES = [
	"draft",
	"pending_payment",
	"pending_review",
	"rejected",
	"verification_expired",
];

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	const verificationStatus = identity.verificationStatus ?? "draft";
	const showVerificationCta = INCOMPLETE_STATUSES.includes(verificationStatus);

	return (
		<>
			<DashboardTopbar title="My Dashboard" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				{/* status overview row */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<VerificationStatusCard verificationState={verificationStatus} />

					<VerificationProgressCard status={verificationStatus} />

					{/* activity placeholder */}
					<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
						<p className="text-muted-foreground text-sm font-semibold">Activity</p>
						<p className="font-display text-foreground mt-2 text-2xl font-bold">
							Coming Soon
						</p>
						<p className="text-muted-foreground mt-1 text-sm">
							Your recent activity and updates will appear here.
						</p>
					</div>
				</div>

				{/* verification CTA — only shown when verification is incomplete */}
				{showVerificationCta && (
					<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
						<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
							<div>
								<p className="text-muted-foreground text-sm font-semibold">
									Complete Your Verification
								</p>
								<p className="text-muted-foreground mt-1 text-sm">
									Upload your documents and submit for admin review to get your verified
									badge and appear in the directory.
								</p>
							</div>
							<Link
								href="/dashboard/mjakazi/verification"
								className="bg-primary text-primary-foreground hover:bg-brand-primary-light inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
							>
								Go to Verification
								<ArrowRight className="size-4" />
							</Link>
						</div>
					</div>
				)}
			</main>
		</>
	);
};

export { Page as default };
