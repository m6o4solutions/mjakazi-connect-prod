import { isAuthenticated, isPublic } from "@/payload/access/access-control";
import { slugField } from "@/payload/fields/slug";
import type { CollectionConfig } from "payload";

const Categories: CollectionConfig = {
	slug: "categories",
	access: {
		create: isAuthenticated,
		delete: isAuthenticated,
		read: isPublic,
		update: isAuthenticated,
	},
	admin: {
		defaultColumns: ["title", "slug", "createdAt", "updatedAt"],
		useAsTitle: "title",
	},
	labels: { singular: "Category", plural: "Categories" },
	fields: [
		{ name: "title", type: "text", label: "Title", required: true },
		{ name: "description", type: "textarea", label: "Description" },
		...slugField(),
	],
};

export { Categories };
