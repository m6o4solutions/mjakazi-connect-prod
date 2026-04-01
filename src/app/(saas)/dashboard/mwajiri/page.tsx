import { DisplayNameForm } from "@/components/dashboard/mwajiri/display-name-form";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const Page = async () => {
	// gate access: unauthenticated users are sent to sign-in
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });

	// resolve the internal identity linked to this Clerk user
	const identity = await resolveIdentity(payload, userId);

	// only mwajiri (employer) accounts are allowed on this dashboard
	if (!identity || identity.role !== "mwajiri") redirect("/sign-in");

	// load the employer's profile to surface their current display name
	const profileQuery = await payload.find({
		collection: "waajiriprofiles",
		where: { account: { equals: identity.accountId } },
		overrideAccess: true, // bypass collection-level access since we've already verified role above
		limit: 1,
	});

	const profile = profileQuery.docs[0] ?? null;
	// fall back to a sensible default if the profile hasn't been named yet
	const currentDisplayName = profile?.displayName ?? "New Employer";

	return (
		<>
			<DashboardTopbar title="My Dashboard" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				{/* overview cards — subscription, worker browsing, and activity are all pending features */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{/* placeholder until billing/subscription is wired up */}
					<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
						<p className="text-muted-foreground text-sm font-semibold">
							Subscription Status
						</p>
						<div className="bg-muted/40 flex items-start gap-3 rounded-lg px-4 py-3">
							<CreditCard className="text-muted-foreground mt-0.5 size-5 shrink-0" />
							<div>
								<p className="text-foreground text-sm font-bold">
									No Active Subscription
								</p>
								<p className="text-muted-foreground mt-0.5 text-xs">
									Subscription management will be available in a future update.
								</p>
							</div>
						</div>
					</div>

					{/* placeholder until worker search is built — gated behind an active subscription */}
					<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
						<p className="text-muted-foreground text-sm font-semibold">Browse Wajakazi</p>
						<p className="font-display text-foreground mt-2 text-2xl font-bold">
							Coming Soon
						</p>
						<p className="text-muted-foreground text-sm">
							Search and filter verified domestic workers once your subscription is
							active.
						</p>
					</div>

					{/* placeholder for the employer's hiring and contact-unlock history */}
					<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
						<p className="text-muted-foreground text-sm font-semibold">Activity</p>
						<p className="font-display text-foreground mt-2 text-2xl font-bold">
							Coming Soon
						</p>
						<p className="text-muted-foreground text-sm">
							Your contact unlocks and hiring activity will appear here.
						</p>
					</div>
				</div>

				{/* profile setup — lets the employer set their visible display name */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<DisplayNameForm currentDisplayName={currentDisplayName} />
				</div>
			</main>
		</>
	);
};

export { Page as default };
