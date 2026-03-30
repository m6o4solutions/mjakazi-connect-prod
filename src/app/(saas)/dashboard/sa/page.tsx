import { CreateAdminForm } from "@/components/dashboard/sa/create-admin-form";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Activity, Settings, Users } from "lucide-react";

const Page = () => {
	return (
		<>
			<DashboardTopbar title="Super Admin Dashboard" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				{/* system overview placeholders */}
				<div className="grid gap-6 md:grid-cols-3">
					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Activity className="text-muted-foreground h-4 w-4" />
							<p className="text-muted-foreground text-sm font-semibold">System Health</p>
						</div>
						<p className="font-display text-foreground text-2xl font-bold">Coming Soon</p>
						<p className="text-muted-foreground text-sm">
							Platform uptime, error rates, and job queue status.
						</p>
					</div>

					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Users className="text-muted-foreground h-4 w-4" />
							<p className="text-muted-foreground text-sm font-semibold">Staff</p>
						</div>
						<p className="font-display text-foreground text-2xl font-bold">Coming Soon</p>
						<p className="text-muted-foreground text-sm">
							View and manage all admin accounts on the platform.
						</p>
					</div>

					<div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-6">
						<div className="flex items-center gap-2">
							<Settings className="text-muted-foreground h-4 w-4" />
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

				{/* staff creation — functional now */}
				<div className="grid gap-6 md:grid-cols-2">
					<CreateAdminForm />
				</div>
			</main>
		</>
	);
};

export { Page as default };
