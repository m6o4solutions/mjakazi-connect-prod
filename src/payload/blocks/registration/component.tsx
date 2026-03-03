import { Container } from "@/components/container";
import { Media } from "@/components/media";
import { cn } from "@/lib/utils";
import { Registration } from "@/payload-types";

// defines visual themes for the block background
const bgMap: Record<string, string> = { subtle: "bg-bg-subtle", white: "bg-bg-white" };

// provides dual registration pathways for different user personas
const RegistrationBlock = ({
	backgroundVariant = "subtle",
	mjakaziCard,
	mwaajiriCard,
}: Registration) => {
	// determines background style based on cms configuration
	const backgroundClass = bgMap[backgroundVariant] ?? "bg-bg-subtle";

	return (
		<section className={cn("border-border-subtle, border-t, py-5", backgroundClass)}>
			<Container className="px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					{/* registration pathway for job seekers */}
					<div className="group border-border-subtle bg-card hover:border-brand-primary/20 rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
						<div className="mb-6 overflow-hidden rounded-lg">
							<Media
								resource={mjakaziCard.image}
								className="aspect-video object-cover"
								unoptimized
							/>
						</div>
						<h3 className="font-display text-text-default text-xl font-bold">
							{mjakaziCard.title || "#"}
						</h3>
						<p className="text-muted-foreground mt-2">{mjakaziCard.description || "#"}</p>
						<div className="mt-6">
							<a
								href={mjakaziCard.buttonLink || "#"}
								className="bg-brand-primary text-primary-foreground shadow-brand-primary/20 hover:bg-brand-primary-light inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium shadow-lg transition-all duration-200"
							>
								{mjakaziCard.buttonText || "#"}
							</a>
						</div>
					</div>

					{/* registration pathway for employers */}
					<div className="group border-border-subtle bg-card hover:border-brand-primary/20 rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
						<div className="mb-6 overflow-hidden rounded-lg">
							<Media
								resource={mwaajiriCard.image}
								className="aspect-video object-cover"
								unoptimized
							/>
						</div>
						<h3 className="font-display text-text-default text-xl font-bold">
							{mwaajiriCard.title || "#"}
						</h3>
						<p className="text-muted-foreground mt-2">
							{mwaajiriCard.description || "#"}
						</p>
						<div className="mt-6">
							<a
								href={mwaajiriCard.buttonLink || "#"}
								className="bg-brand-primary text-primary-foreground shadow-brand-primary/20 hover:bg-brand-primary-light inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium shadow-lg transition-all duration-200"
							>
								{mwaajiriCard.buttonText || "#"}
							</a>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
};

export { RegistrationBlock };
