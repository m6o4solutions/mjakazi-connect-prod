import { Container } from "@/components/container";
import { Media } from "@/components/media";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Registration } from "@/payload-types";
import Link from "next/link";

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
					{/* registration pathway for wajakazi */}
					<div className="group border-border-subtle bg-card hover:border-brand-primary/20 rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
						<div className="mb-6 overflow-hidden rounded-lg">
							<Media
								resource={mjakaziCard.image}
								className="aspect-video object-cover"
								unoptimized
							/>
						</div>
						<h3 className="font-display text-text-default text-xl font-bold">
							{mjakaziCard.title}
						</h3>
						<p className="text-muted-foreground mt-2">{mjakaziCard.description}</p>
						<div className="mt-6">
							<Button
								asChild
								className="bg-brand-primary hover:bg-brand-primary-light rounded-lg"
							>
								<Link href={mjakaziCard.buttonLink || "#"}>{mjakaziCard.buttonText}</Link>
							</Button>
						</div>
					</div>

					{/* registration pathway for waajiri */}
					<div className="group border-border-subtle bg-card hover:border-brand-primary/20 rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl">
						<div className="mb-6 overflow-hidden rounded-lg">
							<Media
								resource={mwaajiriCard.image}
								className="aspect-video object-cover"
								unoptimized
							/>
						</div>
						<h3 className="font-display text-text-default text-xl font-bold">
							{mwaajiriCard.title}
						</h3>
						<p className="text-muted-foreground mt-2">{mwaajiriCard.description}</p>
						<div className="mt-6">
							<Button
								asChild
								className="bg-brand-primary hover:bg-brand-primary-light rounded-lg"
							>
								<Link href={mwaajiriCard.buttonLink || "#"}>
									{mwaajiriCard.buttonText}
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
};

export { RegistrationBlock };
