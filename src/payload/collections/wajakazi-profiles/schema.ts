import { isAdminOrOwnProfile, isRestricted } from "@/payload/access/access-control";
import type { CollectionConfig } from "payload";

// defines public worker profiles linked to user accounts
const WajakaziProfiles: CollectionConfig = {
	slug: "wajakaziprofiles",
	access: {
		// profiles are managed through system hooks or server-side logic
		create: isRestricted,
		update: isRestricted,
		delete: isRestricted,
		// allows admins and the profile owner to view the data
		read: isAdminOrOwnProfile,
	},
	admin: {
		useAsTitle: "displayName",
		defaultColumns: ["displayName", "verificationStatus", "createdAt", "updatedAt"],
		group: "SaaS",
	},
	labels: { singular: "Mjakazi Profile", plural: "Wajakazi Profiles" },
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
			name: "profession",
			type: "text",
			label: "Profession",
			required: true,
			index: true,
		},
		{
			name: "bio",
			type: "textarea",
			label: "Bio",
		},
		{
			name: "location",
			type: "text",
			label: "Location",
			index: true,
		},
		{
			// tracks the vetting process for the worker profile
			name: "verificationStatus",
			type: "select",
			label: "Verification Status",
			required: true,
			index: true,
			options: [
				{ label: "Unverified", value: "unverified" },
				{ label: "Pending Review", value: "pending" },
				{ label: "Verified", value: "verified" },
				{ label: "Rejected", value: "rejected" },
			],
			defaultValue: "unverified",
		},
		{
			name: "verificationSubmittedAt",
			type: "date",
			label: "Verification Submitted At",
			admin: { readOnly: true },
		},
		{
			name: "verificationReviewedAt",
			type: "date",
			label: "Verification Reviewed At",
			admin: { readOnly: true },
		},
		{
			// provides a space for administrative feedback during the review process
			name: "verificationNotes",
			type: "textarea",
			label: "Verification Notes",
			admin: { description: "Internal moderation notes" },
		},
		{
			// allows for multiple supporting files to be attached for verification
			name: "documents",
			type: "relationship",
			label: "Verification Documents",
			relationTo: "media",
			hasMany: true,
		},
	],
};

export { WajakaziProfiles };
