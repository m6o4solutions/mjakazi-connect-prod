import { DocumentUploadCard } from "@/components/dashboard/document-upload-card";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { VerificationProgress } from "@/components/dashboard/verification-progress";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

// map technical status keys to human-readable labels for the dashboard ui
const statusDisplayMap: Record<string, string> = {
	draft: "Draft",
	pending_payment: "Pending Payment",
	pending_review: "Pending Review",
	verified: "Verified",
	rejected: "Rejected",
	verification_expired: "Expired",
	blacklisted: "Blacklisted",
	deactivated: "Deactivated",
	unknown: "Unknown",
};

// correlate verification states with semantic colors to convey status urgency
const statusColorMap: Record<string, string> = {
	draft: "text-muted-foreground",
	pending_payment: "text-warning",
	pending_review: "text-primary",
	verified: "text-accent",
	rejected: "text-destructive",
	verification_expired: "text-destructive",
	blacklisted: "text-destructive",
	deactivated: "text-muted-foreground",
	unknown: "text-muted-foreground",
};

const Page = async () => {
	// ensure the user is authenticated before attempting to resolve identity
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	// initialize payload and fetch the identity record linked to the clerk user
	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// guard against rare race conditions where identity has not yet synchronized
	if (!identity) redirect("/post-auth");

	// handle scenarios where identity or status might be missing
	const verificationStatus = identity?.verificationStatus ?? "unknown";

	const verificationStatusLabel =
		statusDisplayMap[verificationStatus] ?? verificationStatus;

	const statusColor = statusColorMap[verificationStatus] ?? "text-foreground";

	return (
		<>
			{/* provide consistent header navigation and context */}
			<DashboardTopbar title="My Dashboard" />

			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{/* highlight the worker's current verification lifecycle stage */}
					<div className="bg-card border-border rounded-xl border p-6">
						<div className="flex flex-col gap-2">
							<p className="text-muted-foreground text-sm font-semibold">
								Verification Status
							</p>

							<p className={`font-display text-2xl font-bold ${statusColor}`}>
								{verificationStatusLabel}
							</p>

							<p className="text-muted-foreground text-sm">
								This reflects the current review state of your worker verification.
							</p>
						</div>
					</div>

					{/* visual progress representation of the verification journey */}
					<VerificationProgress status={verificationStatus} />

					{/* future container for a chronological feed of user activity */}
					<div className="bg-card border-border rounded-xl border p-6">
						<div className="flex flex-col gap-2">
							<p className="text-muted-foreground text-sm font-semibold">Activity</p>

							<p className="font-display text-foreground text-2xl font-bold">
								Coming Soon
							</p>

							<p className="text-muted-foreground text-sm">
								Your recent activity and updates will appear here.
							</p>
						</div>
					</div>

					{/* upload national id */}
					<DocumentUploadCard documentType="national_id" label="National ID" />

					{/* upload certificate of good conduct */}
					<DocumentUploadCard
						documentType="good_conduct"
						label="Certificate of Good Conduct"
					/>
				</div>
			</main>
		</>
	);
};

export { Page as default };
