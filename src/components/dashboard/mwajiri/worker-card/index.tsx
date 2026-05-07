import { BookOpen, Briefcase, Calendar, Globe, MapPin, Wallet } from "lucide-react";
import { LANGUAGE_OPTIONS } from "@/lib/profile-constants";
import Link from "next/link";

interface JobLabel {
	label: string;
	icon: string;
}

interface WorkerCardProps {
	id: string;
	displayName: string;
	photoUrl: string | null;
	bio: string | null;
	jobLabels: JobLabel[];
	locationLabel: string | null;
	experience: number | null;
	workPreference: string | null;
	languages: string[];
	salaryMin: number | null;
	salaryMax: number | null;
	educationLevel: string | null;
}

const workPreferenceLabel: Record<string, string> = {
	live_in: "Live-in (stays with family)",
	live_out: "Live-out (commutes daily)",
	either: "Live-in or Live-out (flexible)",
};

const educationLevelLabel: Record<string, string> = {
	primary: "Primary School",
	secondary: "Secondary School",
	certificate: "Post Secondary Certificate",
	diploma: "Diploma",
	degree: "Bachelor's Degree",
	postgraduate: "Postgraduate",
};

const WorkerCard = ({
	id,
	displayName,
	photoUrl,
	bio,
	jobLabels,
	locationLabel,
	experience,
	workPreference,
	languages,
	salaryMin,
	salaryMax,
	educationLevel,
}: WorkerCardProps) => {
	const firstName = displayName.split(" ")[0];

	// resolve human-readable language labels
	const languageLabels = languages
		.map((l) => LANGUAGE_OPTIONS.find((o) => o.value === l)?.label ?? l)
		.slice(0, 4);

	// format salary range for display
	const salaryDisplay =
		salaryMin !== null && salaryMax !== null
			? `KSh ${salaryMin.toLocaleString()} – ${salaryMax.toLocaleString()} / mo`
			: salaryMin !== null
				? `From KSh ${salaryMin.toLocaleString()} / mo`
				: salaryMax !== null
					? `Up to KSh ${salaryMax.toLocaleString()} / mo`
					: null;

	return (
		<div className="bg-card border-border flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-md">
			{/* photo area */}
			<div className="bg-muted relative aspect-4/3 overflow-hidden">
				{photoUrl ? (
					<img
						src={photoUrl}
						alt={`${firstName}'s profile`}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="bg-primary/10 flex h-full w-full items-center justify-center">
						<span className="text-primary/40 font-display text-5xl font-bold">
							{firstName[0]?.toUpperCase() ?? "?"}
						</span>
					</div>
				)}

				{/* verified badge */}
				<div className="absolute top-3 left-3">
					<span className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm">
						<span className="size-1.5 rounded-full bg-current opacity-80" />
						Verified
					</span>
				</div>
			</div>

			{/* card body */}
			<div className="flex flex-1 flex-col gap-4 p-5">
				{/* name */}
				<h3 className="font-display text-foreground text-lg font-bold">{displayName}</h3>

				{/* bio */}
				{bio && (
					<p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
						{bio}
					</p>
				)}

				{/* key stats */}
				<div className="flex flex-col gap-1.5">
					{workPreference && (
						<div className="text-muted-foreground flex items-start gap-1.5 text-xs">
							<Briefcase className="mt-0.5 size-3.5 shrink-0" />
							<span>{workPreferenceLabel[workPreference] ?? workPreference}</span>
						</div>
					)}
					{locationLabel && (
						<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
							<MapPin className="size-3.5 shrink-0" />
							<span>Location: {locationLabel}</span>
						</div>
					)}
					{experience !== null && experience !== undefined && (
						<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
							<Calendar className="size-3.5 shrink-0" />
							<span>
								Experience: {experience === 1 ? "1 year" : `${experience} years`}
							</span>
						</div>
					)}
					{educationLevel && (
						<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
							<BookOpen className="size-3.5 shrink-0" />
							<span>{educationLevelLabel[educationLevel] ?? educationLevel}</span>
						</div>
					)}
					{salaryDisplay && (
						<div className="text-muted-foreground flex items-center gap-1.5 text-xs">
							<Wallet className="size-3.5 shrink-0" />
							<span>{salaryDisplay}</span>
						</div>
					)}
				</div>

				{/* job pills with icons */}
				{jobLabels.length > 0 && (
					<div className="flex flex-col gap-1.5">
						<p className="text-muted-foreground text-xs font-medium">
							What I can help with
						</p>
						<div className="flex flex-wrap gap-1.5">
							{jobLabels.map(({ label, icon }) => (
								<span
									key={label}
									className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
								>
									{icon && <span className="text-[11px]">{icon}</span>}
									{label}
								</span>
							))}
						</div>
					</div>
				)}

				{/* languages */}
				{languageLabels.length > 0 && (
					<div className="flex flex-col gap-1.5">
						<p className="text-muted-foreground text-xs font-medium">Languages</p>
						<div className="flex flex-wrap gap-1.5">
							{languageLabels.map((lang) => (
								<span
									key={lang}
									className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
								>
									<Globe className="size-3" />
									{lang}
								</span>
							))}
						</div>
					</div>
				)}

				{/* view profile link */}
				<Link
					href={`/dashboard/mwajiri/browse/${id}`}
					className="bg-primary text-primary-foreground hover:bg-primary/90 mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
				>
					View Full Profile
				</Link>
			</div>
		</div>
	);
};

export { WorkerCard };
