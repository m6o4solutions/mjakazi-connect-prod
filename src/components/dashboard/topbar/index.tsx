import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";

interface DashboardTopbarProps {
	title: string;
}

const DashboardTopbar = ({ title }: DashboardTopbarProps) => {
	return (
		// provide a persistent header for page titles and global actions
		<header className="border-border bg-background sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4">
			{/* allow manual control of sidebar visibility on smaller viewports */}
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="h-5" />
			{/* display current context or page title clearly */}
			<h1 className="font-display text-foreground text-base font-semibold">{title}</h1>
			<div className="ml-auto flex items-center gap-2">
				{/* entry point for system and user notifications */}
				<Button variant="ghost" size="icon" className="relative h-8 w-8">
					<Bell className="h-4 w-4" />
					{/* visual indicator for unread activity or alerts */}
					<span className="bg-destructive absolute top-1.5 right-1.5 size-1.5 rounded-full" />
				</Button>
			</div>
		</header>
	);
};

export { DashboardTopbar };
