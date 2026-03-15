import { DashboardTopbar } from "@/components/dashboard/topbar";

const Page = () => {
	return (
		<>
			{/* provide clear navigation context for the current view */}
			<DashboardTopbar title="My Dashboard" />
			{/* center placeholder content to manage user expectations during development */}
			<main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
				<div className="flex flex-col items-center gap-4">
					{/* visual anchor for the coming soon state */}
					<div className="bg-muted flex h-14 w-14 items-center justify-center rounded-2xl">
						<span className="text-2xl">🏗️</span>
					</div>
					<div>
						<h2 className="font-display text-foreground text-lg font-bold">
							Dashboard coming soon
						</h2>
						{/* clarify the intended purpose of this view for the user */}
						<p className="text-muted-foreground mt-1 max-w-xs text-sm">
							Browse Wajakazi, manage your subscription, and track your hiring activity
							here once built out.
						</p>
					</div>
				</div>
			</main>
		</>
	);
};

export { Page as default };
