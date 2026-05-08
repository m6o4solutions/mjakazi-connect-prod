import { Briefcase, Calendar, MapPin } from "lucide-react";
import { JOB_OPTIONS } from "@/lib/profile-constants";
import Link from "next/link";

interface WajakaziTeaserCardProps {
	firstName: string;
	photoUrl: string | null;
	jobLabels: string[];
	locationLabel: string | null;
	experience: number | null;
	workPreference: string | null;
	buttonLink: string;
	buttonText: string;
}

const workPreferenceLabel: Record<string, string> = {
	live_in: "Live-in (stays with family)",
	live_out: "Live-out (commutes daily)",
	either: "Live-in or Live-out (flexible)",
};

const WajakaziTeaserCard = ({
	firstName,
	photoUrl,
	jobLabels,
	locationLabel,
	experience,
	workPreference,
	buttonLink,
	buttonText,
}: WajakaziTeaserCardProps) => {
	return (
		<div className="group border-border-subtle bg-card hover:border-brand-primary/30 flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg">
			{/* profile image or fallback initials */}
			<div className="bg-muted relative aspect-4/3 overflow-hidden">
				{photoUrl ? (
					<img
						src={photoUrl}
						alt={`${firstName}'s profile`}
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				) : (
					<div className="from-brand-primary/10 to-brand-primary/5 flex h-full w-full items-center justify-center bg-linear-to-br">
						<span className="text-brand-primary/40 font-display text-5xl font-bold">
							{firstName[0]?.toUpperCase() ?? "?"}
						</span>
					</div>
				)}

				{/* visual verification badge */}
				<div className="absolute top-3 left-3">
					<span className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm">
						<span className="size-1.5 rounded-full bg-current opacity-80" />
						Verified
					</span>
				</div>
			</div>

			{/* profile details section */}
			<div className="flex flex-1 flex-col gap-4 p-5">
				{/* name */}
				<h3 className="font-display text-text-default text-lg font-bold">{firstName}</h3>

				{/* key stats — labelled for clarity */}
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
				</div>

				{/* job pills with icons */}
				{jobLabels.length > 0 && (
					<div className="flex flex-col gap-1.5">
						<p className="text-muted-foreground text-xs font-medium">
							What I can help with
						</p>
						<div className="flex flex-wrap gap-1.5">
							{jobLabels.map((label) => {
								const jobOption = JOB_OPTIONS.find((o) => o.label === label);
								return (
									<span
										key={label}
										className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
									>
										{jobOption?.icon && (
											<span className="text-[11px]">{jobOption.icon}</span>
										)}
										{label}
									</span>
								);
							})}
						</div>
					</div>
				)}

				{/* primary cta — destination and label controlled by cms */}
				<Link
					href={buttonLink}
					className="bg-brand-primary text-primary-foreground hover:bg-brand-primary-light mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
				>
					{buttonText}
				</Link>

				{/* secondary link for returning users */}
				<p className="text-muted-foreground text-center text-xs">
					Already have a Mwajiri account?{" "}
					<Link
						href="/sign-in"
						className="text-brand-primary font-medium hover:underline"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
};

export { WajakaziTeaserCard };
