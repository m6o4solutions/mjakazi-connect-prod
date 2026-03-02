import { isAuthenticated } from "@/payload/access/access-control";
import type { CollectionConfig, FieldHook } from "payload";

const populateFullName: FieldHook = async ({ data }) => {
	return `${data?.firstName} ${data?.lastName}`;
};

const Users: CollectionConfig = {
	slug: "users",
	access: {
		admin: isAuthenticated,
		create: isAuthenticated,
		delete: isAuthenticated,
		read: isAuthenticated,
		update: isAuthenticated,
	},
	admin: {
		defaultColumns: ["name", "photo", "email", "createdAt", "updatedAt"],
		useAsTitle: "name",
	},
	labels: { singular: "User", plural: "Users" },
	auth: true,
	fields: [
		{
			type: "row",
			fields: [
				{
					name: "firstName",
					type: "text",
					label: "First Name",
					required: true,
					admin: { width: "50%" },
				},
				{
					name: "lastName",
					type: "text",
					label: "Last Name",
					required: true,
					admin: { width: "50%" },
				},
			],
		},
		{
			name: "name",
			type: "text",
			label: "Name",
			admin: { position: "sidebar", hidden: true, readOnly: true },
			hooks: { beforeValidate: [populateFullName] },
		},
		{
			name: "photo",
			type: "upload",
			label: "Photo",
			relationTo: "media",
			admin: { position: "sidebar" },
		},
	],
};

export { Users };
