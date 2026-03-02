import { ClarityTracker } from "@/components/clarity-tracker";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Footer } from "@/payload/blocks/globals/footer/component";
import { Header } from "@/payload/blocks/globals/header/component";
import { getServerSideURL } from "@/payload/utilities/get-url";
import { mergeOpenGraph } from "@/payload/utilities/merge-opengraph";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

// import global styles for the application
import "@/styles/globals.css";

// load the inter font with the 'latin' subset for typography consistency
const inter = Inter({ subsets: ["latin"] });

// the primary layout component for the entire application, wrapping all pages.
const RootLayout = async (props: { children: ReactNode }) => {
	const { children } = props;

	return (
		// set html language attribute and suppress hydration warnings for next-themes compatibility
		<html lang="en" suppressHydrationWarning>
			{/* apply base styles, flex column layout for full viewport height, and the inter font class */}
			<body className={cn("flex h-screen flex-col", inter.className)}>
				{/* track user behavior early in the lifecycle to catch session starts */}
				<ClarityTracker />

				{/* theme provider manages dark/light mode state using the 'class' attribute on the html element */}
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem // allows the browser/os setting to determine the initial theme
					disableTransitionOnChange // prevents a visual flash when the theme switches
				>
					{/* header component, fetched as a global from Payload CMS */}
					<header>
						<Header />
					</header>

					{/* main content area, rendered with the current page */}
					<main>{children}</main>

					{/* footer component, pinned to the bottom using 'mt-auto' within the flex container */}
					<footer className="mt-auto">
						<Footer />
					</footer>
				</ThemeProvider>
			</body>
		</html>
	);
};

// next.js metadata object for site-wide seo and social sharing configuration.
const metadata: Metadata = {
	// sets the base url for all relative urls in the metadata (e.g., og images)
	metadataBase: new URL(getServerSideURL()),
	// merges site-wide open graph defaults (like site name and description)
	openGraph: mergeOpenGraph(),
	twitter: {
		card: "summary_large_image", // ensures a large image display on twitter cards
		creator: "@m6o4solutions", // explicitly sets the twitter account creator
	},
	icons: {
		icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
	},
};

export { RootLayout as default, metadata };
