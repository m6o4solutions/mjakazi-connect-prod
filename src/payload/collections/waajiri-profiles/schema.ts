import { isAdminOrProfileOwner, isRestricted } from "@/payload/access/access-control";
import type { CollectionConfig } from "payload";

// defines employer profiles linked to user accounts
const WaajiriProfiles: CollectionConfig = {
	slug: "waajiriprofiles",
	access: {
		// profiles are managed through system hooks or server-side logic
		create: isRestricted,
		update: isRestricted,
		delete: isRestricted,
		// allows admins and the profile owner to view the data
		read: isAdminOrProfileOwner,
	},
	admin: {
		useAsTitle: "displayName",
		defaultColumns: ["displayName", "moderationStatus", "createdAt", "updatedAt"],
		group: "SaaS",
	},
	labels: { singular: "Mwajiri Profile", plural: "Waajiri Profiles" },
	fields: [
		{
			// establishes a unique link to the primary user account
			name: "account",
			type: "relationship",
			label: "Account",
			relationTo: "accounts",
			required: true,
			unique: true,
			index: true,
		},
		{
			name: "displayName",
			type: "text",
			label: "Display Name",
			required: true,
			index: true,
		},
		{
			name: "organization",
			type: "text",
			label: "Organization",
			index: true,
		},
		{
			name: "phoneNumber",
			type: "text",
			label: "Phone Number",
		},
		{
			name: "location",
			type: "text",
			label: "Location",
			index: true,
		},
		{
			name: "bio",
			type: "textarea",
			label: "Bio",
		},
		{
			// tracks the status of the employer profile for safety and compliance
			name: "moderationStatus",
			type: "select",
			label: "Moderation Status",
			required: true,
			index: true,
			options: [
				{ label: "Active", value: "active" },
				{ label: "Flagged", value: "flagged" },
				{ label: "Suspended", value: "suspended" },
			],
			defaultValue: "active",
		},
	],
};

export { WaajiriProfiles };
