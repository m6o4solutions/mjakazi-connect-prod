import { getServerSideURL } from "@/payload/utilities/get-url";
import type { Metadata } from "next";

// default open graph metadata used across pages
const defaultOpenGraph: Metadata["openGraph"] = {
	type: "website",
	description:
		"M6O4 delivers trusted, modern technology solutions that help businesses grow with confidence.",
	images: [
		{
			url: `${getServerSideURL()}/abstract-image-1.jpg`,
		},
	],
	siteName: "M6O4 Solutions",
	title: "M6O4 Solutions",
};

// merges provided open graph data with defaults to ensure required fields exist
const mergeOpenGraph = (og?: Metadata["openGraph"]): Metadata["openGraph"] => {
	return {
		...defaultOpenGraph,
		...og,
		// keep custom images if provided, otherwise use default ones
		images: og?.images ? og.images : defaultOpenGraph.images,
	};
};

export { mergeOpenGraph };
