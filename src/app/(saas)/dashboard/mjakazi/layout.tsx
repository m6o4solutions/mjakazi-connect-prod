import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

const MjakaziDashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		// establish the context for sidebar state and interactions
		<SidebarProvider>
			{/* provide navigation tailored to the mjakazi role */}
			<DashboardSidebar role="mjakazi" />
			{/* wrap the primary dashboard view to allow for responsive sidebar offsets */}
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
};

export { MjakaziDashboardLayout as default };
