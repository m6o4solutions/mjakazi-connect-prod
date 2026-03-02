import { isAuthenticated, isPublic } from "@/payload/access/access-control";
import {
	FixedToolbarFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";

const Media: CollectionConfig = {
	slug: "media",
	access: {
		create: isAuthenticated,
		delete: isAuthenticated,
		read: isPublic,
		update: isAuthenticated,
	},
	admin: {
		defaultColumns: ["filename", "alt", "caption", "createdAt", "updatedAt"],
		useAsTitle: "filename",
	},
	labels: { singular: "Media", plural: "Media" },
	fields: [
		{ name: "alt", type: "text", label: "Alt Text", required: true },
		{
			name: "caption",
			type: "richText",
			label: "Caption",
			editor: lexicalEditor({
				features: ({ rootFeatures }) => {
					return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()];
				},
			}),
		},
	],
	upload: {
		adminThumbnail: "thumbnail",
		focalPoint: true,
		imageSizes: [
			{ name: "thumbnail", width: 300 },
			{ name: "square", width: 500, height: 500 },
			{ name: "small", width: 600 },
			{ name: "medium", width: 900 },
			{ name: "large", width: 1400 },
			{ name: "xlarge", width: 1920 },
			{ name: "og", width: 1200, height: 630, crop: "center" },
		],
		mimeTypes: ["image/*"],
	},
};

export { Media };
