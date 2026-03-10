import { isAdminOrOwnAccount, isRestricted } from "@/payload/access/access-control";
import type { CollectionConfig, FieldHook } from "payload";

// combines first and last names into a single searchable string
const populateFullName: FieldHook = async ({ data, siblingData }) => {
	const first = siblingData?.firstName ?? data?.firstName ?? "";
	const last = siblingData?.lastName ?? data?.lastName ?? "";

	return `${first} ${last}`.trim();
};

// defines user account profiles and their associated roles
const Accounts: CollectionConfig = {
	slug: "accounts",
	access: {
		// creation and deletion are handled via system logic or webhooks
		create: isRestricted,
		delete: isRestricted,
		// allows admins full visibility and users access to their own profile
		read: isAdminOrOwnAccount,
		// updates are restricted to ensure data integrity through external sync
		update: isRestricted,
	},
	admin: {
		defaultColumns: ["fullName", "email", "createdAt", "updatedAt"],
		group: "SaaS",
		useAsTitle: "fullName",
	},
	labels: { singular: "Account", plural: "Accounts" },
	fields: [
		{
			// stores the unique identifier from the external authentication provider
			name: "clerkId",
			type: "text",
			required: true,
			unique: true,
			index: true,
		},
		{
			type: "row",
			fields: [
				{
					name: "firstName",
					type: "text",
					label: "First Name",
					admin: { width: "50%" },
				},
				{
					name: "lastName",
					type: "text",
					label: "Last Name",
					admin: { width: "50%" },
				},
			],
		},
		{
			name: "email",
			type: "email",
			required: true,
			index: true,
		},
		{
			// defines the user's permissions and access level across the platform
			name: "role",
			type: "select",
			required: true,
			index: true,
			options: [
				{ label: "Mjakazi", value: "mjakazi" },
				{ label: "Mwajiri", value: "mwajiri" },
				{ label: "Admin", value: "admin" },
				{ label: "Super Admin", value: "sa" },
			],
		},
		{
			// derived field for admin display and easy searching
			name: "fullName",
			type: "text",
			label: "Full Name",
			admin: { position: "sidebar", hidden: true, readOnly: true },
			hooks: { beforeValidate: [populateFullName] },
		},
	],
};

export { Accounts };
