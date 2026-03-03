import { ClarityTracker } from "@/components/clarity-tracker";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Footer } from "@/payload/blocks/globals/footer/component";
import { Header } from "@/payload/blocks/globals/header/component";
import { getServerSideURL } from "@/payload/utilities/get-url";
import { mergeOpenGraph } from "@/payload/utilities/merge-opengraph";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { ReactNode } from "react";

// load foundational styles for the web application
import "@/styles/globals.css";

// configure brand-specific typography with css variables for tailwind integration
const grotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-display",
	display: "swap",
});

// define the primary shell for the web frontend, managing site-wide providers and layout structure
const RootLayout = async (props: { children: ReactNode }) => {
	const { children } = props;

	return (
		// enable hydration warning suppression to accommodate theme switching logic
		<html lang="en" suppressHydrationWarning>
			{/* initialize global visual styles and typography variables */}
			<body
				className={cn(
					"bg-bg-subtle text-text-default flex min-h-screen flex-col font-sans antialiased",
					grotesk.variable,
					jakarta.variable,
				)}
			>
				{/* initialize analytics tracking at the entry point */}
				<ClarityTracker />

				{/* provide theme context and manage appearance transitions */}
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					{/* render global site navigation */}
					<header>
						<Header />
					</header>

					{/* injectable region for page-specific content */}
					<main>{children}</main>

					{/* render global site footer with layout-aware positioning */}
					<footer className="mt-auto">
						<Footer />
					</footer>
				</ThemeProvider>
			</body>
		</html>
	);
};

// construct global seo and social metadata using environment-aware utilities
const metadata: Metadata = {
	// establish authority for relative resource resolution
	metadataBase: new URL(getServerSideURL()),
	// aggregate common open graph properties from centralized configuration
	openGraph: mergeOpenGraph(),
	twitter: {
		card: "summary_large_image",
		creator: "@m6o4solutions",
	},
	icons: {
		icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
	},
};

export { RootLayout as default, metadata };
