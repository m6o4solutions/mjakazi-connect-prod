import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

export const metadata: Metadata = { title: "Dashboard" };

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mwajiri") redirect("/sign-in");

	return (
		<>
			<DashboardTopbar title="My Dashboard" />

			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
			</main>
		</>
	);
};

export { Page as default };
