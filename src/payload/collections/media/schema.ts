import { isAuthenticated, isPublic } from "@/payload/access/access-control";
import type { CollectionConfig } from "payload";

// defines the media collection for managing uploads and image processing
const Media: CollectionConfig = {
	slug: "media",
	// restricts modifications to authenticated users while allowing public reading
	access: {
		create: isAuthenticated,
		delete: isAuthenticated,
		read: isPublic,
		update: isAuthenticated,
	},
	// configures the admin interface for file management
	admin: {
		defaultColumns: ["filename", "alt", "createdAt", "updatedAt"],
		group: "Globals",
		useAsTitle: "filename",
	},
	labels: { singular: "Media", plural: "Media" },
	// ensures all assets have descriptive text for accessibility and seo
	fields: [{ name: "alt", type: "text", label: "Alt Text", required: true }],
	// enables file uploads and defines automated image transformations
	upload: {
		adminThumbnail: "thumbnail",
		focalPoint: true,
		// generates multiple responsive image sizes and optimized crops
		imageSizes: [
			{ name: "thumbnail", width: 300 },
			{ name: "square", width: 500, height: 500 },
			{ name: "small", width: 600 },
			{ name: "medium", width: 900 },
			{ name: "large", width: 1400 },
			{ name: "xlarge", width: 1920 },
			{ name: "og", width: 1200, height: 630, crop: "center" },
		],
		// limits accepted file formats to images and documents
		mimeTypes: ["image/*", "application/pdf"],
	},
};

export { Media };
