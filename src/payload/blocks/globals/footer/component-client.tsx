import { Container } from "@/components/container";
import type { Footer } from "@/payload-types";
import { HouseHeart } from "lucide-react";
import Link from "next/link";

interface FooterClientProps {
	data: Footer;
}

// renders the site footer with dynamic content from payload cms
const FooterClient = async ({ data }: FooterClientProps) => {
	const { copyright, legal, organizationName, organizationSlogan, waajiri, wajakazi } =
		data;
	const parts = (organizationName ?? "").split("|").map((s) => s.trim());
	const [main, accent] = parts.length > 1 ? parts : [organizationName ?? "", null];

	return (
		<footer className="border-border-subtle bg-bg-white border-t py-10">
			<Container className="px-4 sm:px-6 lg:px-8">
				<div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
					<div className="col-span-2 space-y-3 lg:col-span-2">
						{/* branding section with logo and organization names */}
						<Link href="/" className="flex cursor-pointer items-center">
							<div className="bg-brand-primary mr-3 flex size-8 items-center justify-center rounded-lg">
								<HouseHeart className="text-primary-foreground size-5" />
							</div>
							<span className="font-display text-text-default text-xl font-bold tracking-tight">
								{main} {accent && <span className="text-brand-primary">{accent}</span>}
							</span>
						</Link>

						<p className="text-muted-foreground mb-6 text-sm leading-relaxed">
							{organizationSlogan}
						</p>
					</div>

					{/* dynamic navigation links for waajiri-oriented content */}
					<div className="space-y-4">
						<h4 className="text-text-default mb-4 font-bold">
							{waajiri?.waajiriHeader || "For Waajiri"}
						</h4>
						<ul className="space-y-3 text-sm">
							{waajiri?.mwaajiriItems?.map((item, i) => (
								<li key={i}>
									<Link
										href={item.link?.url || "#"}
										className="hover:text-brand-primary text-left"
									>
										{item.link?.label || "#"}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* dynamic navigation links for wajakazi-oriented content */}
					<div className="space-y-4">
						<h4 className="text-text-default mb-4 font-bold">
							{wajakazi?.wajakaziHeader || "For Wajakazi"}
						</h4>
						<ul className="space-y-3 text-sm">
							{wajakazi?.wajakaziItems?.map((item, i) => (
								<li key={i}>
									<Link href={item.link?.url || "#"} className="hover:text-brand-primary">
										{item.link?.label || "#"}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* dynamic legal and policy links */}
					<div className="space-y-4">
						<h4 className="text-text-default mb-4 font-bold">
							{legal?.legalHeader || "Legal"}
						</h4>
						<ul className="space-y-3 text-sm">
							{legal?.legalItems?.map((item, i) => (
								<li key={i}>
									<Link href={item.link?.url || "#"} className="hover:text-brand-primary">
										{item.link?.label || "#"}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* bottom bar with current year and copyright notice */}
				<div className="border-border-subtle flex flex-col items-center justify-center border-t pt-8 md:flex-row">
					<p className="text-muted-foreground text-sm">
						&copy; {new Date().getFullYear()} {copyright}
					</p>
				</div>
			</Container>
		</footer>
	);
};

export { FooterClient };
