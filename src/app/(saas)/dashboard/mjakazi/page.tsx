import { ProfileCompletenessCard } from "@/components/dashboard/mjakazi/profile-completeness-card";
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

// verification states that still require action from the worker
const INCOMPLETE_STATUSES = [
	"draft",
	"pending_payment",
	"pending_review",
	"rejected",
	"verification_expired",
];

const Page = async () => {
	const { userId } = await auth();

	// unauthenticated users have no business here
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// only mjakazi (worker) accounts are allowed on this dashboard
	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	const verificationStatus = identity.verificationStatus ?? "draft";
	// drives whether the verification CTA section is rendered
	const showVerificationCta = INCOMPLETE_STATUSES.includes(verificationStatus);

	// fetch the worker's profile so we can evaluate completeness
	const profileQuery = await payload.find({
		collection: "wajakaziprofiles",
		where: { account: { equals: identity.accountId } },
		overrideAccess: true,
		depth: 1,
		limit: 1,
	});

	const profile = profileQuery.docs[0] ?? null;
	// profileComplete is a persisted flag set by the CMS when all required fields are filled
	const profileComplete = profile?.profileComplete ?? false;

	// each item maps a profile requirement to the page where the worker can fulfil it;
	// used by ProfileCompletenessCard to render a checklist with deep links
	const completenessItems = [
		{
			label: "Upload profile photo",
			complete: !!profile?.photo,
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Add display name",
			// "New Worker" is the default placeholder name, so it counts as incomplete
			complete: !!profile?.displayName && profile.displayName !== "New Worker",
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Add legal name",
			complete: !!profile?.legalFirstName && !!profile?.legalLastName,
			href: "/dashboard/mjakazi/verification",
		},
		{
			label: "Write your bio",
			complete: !!profile?.bio?.trim(),
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Select at least one job skill",
			complete: Array.isArray(profile?.jobs) && profile.jobs.length > 0,
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Set your location",
			complete: !!profile?.location,
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Set work preference",
			complete: !!profile?.workPreference,
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Add years of experience",
			// explicit null/undefined check because 0 is a valid experience value
			complete: profile?.experience !== null && profile?.experience !== undefined,
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Select nationality",
			complete: !!profile?.nationality,
			href: "/dashboard/mjakazi/profile",
		},
		{
			label: "Select at least one language",
			complete: Array.isArray(profile?.languages) && profile.languages.length > 0,
			href: "/dashboard/mjakazi/profile",
		},
	];

	return (
		<>
			<DashboardTopbar title="My Dashboard" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				{/* top row: verification status, progress tracker, and a placeholder activity card */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<VerificationStatusCard verificationState={verificationStatus} />
					<VerificationProgressCard status={verificationStatus} />
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

				{/* checklist is suppressed once the worker has completed their profile */}
				{!profileComplete && (
					<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
						<ProfileCompletenessCard
							items={completenessItems}
							profileComplete={profileComplete}
						/>
					</div>
				)}

				{/* prompt workers to complete verification only while their status is still actionable */}
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
