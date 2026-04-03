import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { ReactNode } from "react";

// shared layout for all mjakazi dashboard routes — enforces role guard once
// so individual pages don't need to repeat the auth/identity checks for layout concerns
const MjakaziDashboardLayout = async ({ children }: { children: ReactNode }) => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	// verification status is passed to the sidebar so the nav indicator
	// can reflect whether the worker needs to take action
	const verificationStatus = identity.verificationStatus ?? "draft";

	return (
		<SidebarProvider>
			<DashboardSidebar role="mjakazi" verificationStatus={verificationStatus} />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
};

export { MjakaziDashboardLayout as default };
