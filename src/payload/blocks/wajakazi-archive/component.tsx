import { Container } from "@/components/container";
import { cn } from "@/lib/utils";
import type { WajakaziArchive } from "@/payload-types";
import { ArrowRight, FileCheck } from "lucide-react";
import Link from "next/link";

const bgMap: Record<string, string> = { subtle: "bg-bg-subtle", white: "bg-bg-white" };

const WajakaziArchiveBlock = async ({
	backgroundVariant = "subtle",
	headline,
	headlineDescription,
	id,
}: WajakaziArchive) => {
	const backgroundClass = bgMap[backgroundVariant] ?? "bg-bg-subtle";

	return (
		<div className={cn("px-4 py-20", backgroundClass)}>
			<Container className="px-4 sm:px-6 lg:px-8">
				<div className="px-3" id={`block-${id}`}>
					{/* render headline and description if present */}
					{(headline || headlineDescription) && (
						<div className="mb-12 flex flex-col items-end justify-between md:flex-row">
							<div>
								{headline && (
									<h2 className="font-display text-text-default mb-4 text-3xl font-bold md:text-4xl">
										{headline}
									</h2>
								)}
								{headlineDescription && (
									<p className="text-muted-foreground">{headlineDescription}</p>
								)}
							</div>
							<Link
								href="/directory"
								className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 mt-6 hidden items-center justify-center rounded-lg border px-6 py-3 font-medium transition-all duration-200 md:mt-0 md:inline-flex"
							>
								View Wajakazi <ArrowRight className="ml-2 size-4" />
							</Link>
						</div>
					)}
				</div>
			</Container>
		</div>
	);
};

export { WajakaziArchiveBlock };
