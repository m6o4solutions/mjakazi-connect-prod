import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const Page = async () => {
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) redirect("/sign-in");

	if (identity.role !== "admin" && identity.role !== "sa") {
		redirect("/sign-in");
	}

	return (
		<>
			<DashboardTopbar title="Admin Dashboard" />
			<main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
				<div className="flex flex-col items-center gap-4">
					<div className="bg-muted flex h-14 w-14 items-center justify-center rounded-2xl">
						<span className="text-2xl">🏗️</span>
					</div>
					<div>
						<h2 className="font-display text-foreground text-lg font-bold">
							Admin panel coming soon
						</h2>
						<p className="text-muted-foreground mt-1 max-w-xs text-sm">
							Pending verifications, account moderation, and audit logs will appear here
							once built out.
						</p>
					</div>
				</div>
			</main>
		</>
	);
};

export { Page as default };
