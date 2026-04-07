import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { Activity, Settings, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

export const metadata: Metadata = { title: "Dashboard" };

const Page = async () => {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) redirect("/sign-in");
	if (identity.role !== "sa") redirect("/sign-in");

	// staff count for the overview card
	const staffAccounts = await payload.find({
		collection: "accounts",
		where: { role: { in: ["admin", "sa"] } },
		overrideAccess: true,
		limit: 0,
	});

	return (
		<>
			<DashboardTopbar title="Super Admin Dashboard" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-3">
					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Activity className="text-muted-foreground size-4" />
							<p className="text-muted-foreground text-sm font-semibold">System Health</p>
						</div>
						<p className="font-display text-foreground text-2xl font-bold">Coming Soon</p>
						<p className="text-muted-foreground text-sm">
							Platform uptime, error rates, and job queue status.
						</p>
					</div>

					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Users className="text-muted-foreground size-4" />
							<p className="text-muted-foreground text-sm font-semibold">Staff</p>
						</div>
						<p className="font-display text-foreground text-2xl font-bold">
							{staffAccounts.totalDocs}
						</p>
						<p className="text-muted-foreground text-sm">
							Total staff accounts on the platform.
						</p>
					</div>

					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Settings className="text-muted-foreground size-4" />
							<p className="text-muted-foreground text-sm font-semibold">Settings</p>
						</div>
						<p className="font-display text-foreground text-2xl font-bold">Coming Soon</p>
						<p className="text-muted-foreground text-sm">
							Tier pricing, verification fees, and platform toggles.
						</p>
					</div>
				</div>
			</main>
		</>
	);
};

export { Page as default };
