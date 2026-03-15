import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

const SaDashboardLayout = ({ children }: { children: ReactNode }) => {
	return (
		// establish the context for sidebar state and interactions
		<SidebarProvider>
			{/* provide navigation tailored to the super admin role */}
			<DashboardSidebar role="sa" />
			{/* wrap the primary dashboard view to allow for responsive sidebar offsets */}
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
};

export { SaDashboardLayout as default };
