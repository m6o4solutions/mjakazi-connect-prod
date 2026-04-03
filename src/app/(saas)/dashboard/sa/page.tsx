import { CreateAdminForm } from "@/components/dashboard/sa/create-admin-form";
import { StaffTable } from "@/components/dashboard/sa/staff-table";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { Activity, Settings, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const Page = async () => {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });

	const identity = await resolveIdentity(payload, userId);

	if (!identity) redirect("/sign-in");

	// only sa accounts are permitted on this dashboard
	if (identity.role !== "sa") redirect("/sign-in");

	// load all admin and sa accounts to populate the staff table and summary count
	const staffAccounts = await payload.find({
		collection: "accounts",
		where: { role: { in: ["admin", "sa"] } },
		overrideAccess: true,
		sort: "-createdAt",
		limit: 100,
	});

	const staff = staffAccounts.docs.map((account: any) => ({
		id: account.id,
		clerkId: account.clerkId,
		firstName: account.firstName ?? "",
		lastName: account.lastName ?? "",
		email: account.email,
		role: account.role,
		createdAt: account.createdAt,
	}));

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
							{staff.length}
						</p>
						<p className="text-muted-foreground text-sm">
							Total staff accounts on the platform.
						</p>
					</div>

					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Settings className="text-muted-foreground size-4" />
							<p className="text-muted-foreground text-sm font-semibold">
								Global Settings
							</p>
						</div>
						<p className="font-display text-foreground text-2xl font-bold">Coming Soon</p>
						<p className="text-muted-foreground text-sm">
							Tier pricing, verification fees, and platform toggles.
						</p>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<CreateAdminForm />
				</div>

				<StaffTable staff={staff} currentUserClerkId={userId} />
			</main>
		</>
	);
};

export { Page as default };
