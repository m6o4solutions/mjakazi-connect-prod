import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

interface CompletenessItem {
	label: string;
	complete: boolean;
	href: string;
}

interface ProfileCompletenessCardProps {
	items: CompletenessItem[];
	// true when all required profile sections are done — card is hidden in that case
	profileComplete: boolean;
}

const ProfileCompletenessCard = ({
	items,
	profileComplete,
}: ProfileCompletenessCardProps) => {
	// no need to nudge the user once their profile is fully complete
	if (profileComplete) return null;

	const completedCount = items.filter((i) => i.complete).length;
	// derive percentage from completed steps so the progress bar stays in sync
	const percentage = Math.round((completedCount / items.length) * 100);

	return (
		<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-muted-foreground text-sm font-semibold">
						Profile Completeness
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						Complete your profile to appear in the public directory.
					</p>
				</div>
				<span className="font-display text-primary text-xl font-bold">{percentage}%</span>
			</div>

			{/* fills proportionally to how many steps are done */}
			<div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
				<div
					className="bg-primary h-full rounded-full transition-all duration-500"
					style={{ width: `${percentage}%` }}
				/>
			</div>

			{/* each incomplete step links to the relevant settings section; completed steps are non-interactive */}
			<div className="flex flex-col gap-2">
				{items.map((item) => (
					<Link
						key={item.label}
						// prevent navigation for already-completed items
						href={item.complete ? "#" : item.href}
						className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
							item.complete ? "cursor-default" : "hover:bg-muted cursor-pointer"
						}`}
					>
						{item.complete ? (
							<CheckCircle2 className="text-accent size-4 shrink-0" />
						) : (
							<Circle className="text-muted-foreground size-4 shrink-0" />
						)}
						<span
							className={
								// strike-through reinforces that the step no longer needs attention
								item.complete ? "text-muted-foreground line-through" : "text-foreground"
							}
						>
							{item.label}
						</span>
						{/* arrow acts as a visual cue that the row is actionable */}
						{!item.complete && (
							<ArrowRight className="text-muted-foreground ml-auto size-3.5" />
						)}
					</Link>
				))}
			</div>
		</div>
	);
};

export { ProfileCompletenessCard };
