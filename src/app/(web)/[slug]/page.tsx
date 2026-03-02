import { LivePreviewListener } from "@/components/live-preview-listener";
import { PayloadRedirects } from "@/components/payload-redirects";
import { RenderBlocks } from "@/payload/blocks/render-blocks";
import { generateMeta } from "@/payload/utilities/generate-meta";
import config from "@payload-config";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";

/**
 * generates the static path segments for all published pages in the 'pages' collection,
 * excluding the 'home' page. this is used by next.js for static site generation (ssg).
 */
const generateStaticParams = async () => {
	const payload = await getPayload({ config: config });

	const pages = await payload.find({
		collection: "pages",
		// only find published pages for static generation
		draft: false,
		limit: 0,
		// override access is false to respect standard read rules for static generation
		overrideAccess: false,
		pagination: false,
		select: {
			slug: true,
		},
	});

	const params = pages.docs
		// filter out the 'home' slug since it's handled by the root route
		?.filter((doc) => {
			return doc.slug !== "home";
		})
		// map the remaining documents to the required { slug } object structure
		.map(({ slug }) => {
			return { slug };
		});

	// return the array of static parameters or an empty array if none are found
	return params || [];
};

type Args = { params: Promise<{ slug?: string }> };

/**
 * fetches a single page document from payload based on its slug,
 * respecting the next.js draft mode status for fetching drafts or published content.
 * the result is cached using react's `cache` to avoid redundant database hits.
 */
const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
	// check if draft mode is active in the current request context
	const { isEnabled: draft } = await draftMode();

	const payload = await getPayload({ config: config });

	const result = await payload.find({
		collection: "pages",
		// fetch drafts if draft mode is enabled, otherwise only published content
		draft,
		limit: 1,
		pagination: false,
		// enable access override only in draft mode to ensure preview access to unpublished content
		overrideAccess: draft,
		where: {
			slug: {
				equals: slug,
			},
		},
	});

	// return the first document found or null
	return result.docs?.[0] || null;
});

/**
 * next.js page component responsible for fetching and rendering page content based on slug.
 * it also handles draft mode preview and redirects.
 */
const Page = async ({ params: paramsPromise }: Args) => {
	// check if draft mode is enabled in the current request
	const { isEnabled: draft } = await draftMode();

	// extract the slug from parameters, defaulting to 'home' for the root route
	const { slug = "home" } = await paramsPromise;

	// construct the full url path for redirect checking
	const url = "/" + slug;

	// fetch the page data, using the cached function
	const page = await queryPageBySlug({
		slug,
	});

	// if the page document is not found, delegate to the redirects component for 404 or payload redirects
	if (!page) {
		return <PayloadRedirects url={url} />;
	}

	const { layout } = page;

	return (
		<article>
			{/* render redirects component (allows redirects for valid pages too) */}
			<PayloadRedirects disableNotFound url={url} />

			{/* render the live preview listener only when draft mode is active */}
			{draft && <LivePreviewListener />}

			{/* render the flexible content using the renderblocks utility */}
			<RenderBlocks blocks={layout} />
		</article>
	);
};

/**
 * generates dynamic next.js metadata (seo) for a page based on its slug,
 * fetching data from the corresponding payload document.
 */
const generateMetadata = async ({ params: paramsPromise }: Args): Promise<Metadata> => {
	// extract the slug from parameters, defaulting to 'home' for the root route
	const { slug = "home" } = await paramsPromise;

	// fetch the page document specifically for metadata generation
	const page = await queryPageBySlug({
		slug,
	});

	// use the standard generate meta utility to produce the next.js metadata object
	return generateMeta({ doc: page });
};

export { generateStaticParams, Page as default, generateMetadata };
