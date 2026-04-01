import { isAdminOrProfileOwner, isRestricted } from "@/payload/access/access-control";
import type { CollectionConfig } from "payload";

const WajakaziProfiles: CollectionConfig = {
	slug: "wajakaziprofiles",
	access: {
		create: isRestricted,
		update: isRestricted,
		delete: isRestricted,
		read: isAdminOrProfileOwner,
	},
	admin: {
		useAsTitle: "displayName",
		defaultColumns: ["displayName", "verificationStatus", "createdAt", "updatedAt"],
		group: "SaaS",
	},
	labels: { singular: "Mjakazi Profile", plural: "Wajakazi Profiles" },
	fields: [
		{
			name: "account",
			type: "relationship",
			label: "Account",
			relationTo: "accounts",
			required: true,
			unique: true,
			index: true,
		},
		{
			// google profile name or manually set display name
			name: "displayName",
			type: "text",
			label: "Display Name",
			required: true,
			index: true,
		},
		{
			// legal first name as it appears on national id
			name: "legalFirstName",
			type: "text",
			label: "Legal First Name",
		},
		{
			// legal last name as it appears on national id
			name: "legalLastName",
			type: "text",
			label: "Legal Last Name",
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
			// passport-sized profile photo for marketplace listing
			// not required at schema level but enforced as a visibility
			// requirement at the public directory query level in phase 6
			name: "photo",
			type: "upload",
			label: "Profile Photo",
			relationTo: "media",
		},
		{
			name: "availabilityStatus",
			type: "select",
			label: "Availability Status",
			required: true,
			index: true,
			options: [
				{ label: "Available", value: "available" },
				{ label: "Hired", value: "hired" },
				{ label: "On Break", value: "on_break" },
			],
			defaultValue: "available",
		},
		{
			name: "verificationStatus",
			type: "select",
			label: "Verification Status",
			required: true,
			index: true,
			options: [
				{ label: "Draft", value: "draft" },
				{ label: "Pending Payment", value: "pending_payment" },
				{ label: "Pending Review", value: "pending_review" },
				{ label: "Verified", value: "verified" },
				{ label: "Rejected", value: "rejected" },
				{ label: "Verification Expired", value: "verification_expired" },
				{ label: "Blacklisted", value: "blacklisted" },
				{ label: "Deactivated", value: "deactivated" },
			],
			defaultValue: "draft",
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
			name: "verificationExpiry",
			type: "date",
			label: "Verification Expiry",
			admin: {
				description: "Date when verification expires and requires renewal.",
			},
		},
		{
			name: "verificationAttempts",
			type: "number",
			label: "Verification Attempts",
			defaultValue: 0,
			admin: { readOnly: true },
		},
		{
			name: "rejectionReason",
			type: "textarea",
			label: "Rejection Reason",
			admin: {
				description: "Reason provided when verification is rejected.",
			},
		},
		{
			name: "blacklistedAt",
			type: "date",
			label: "Blacklisted At",
			admin: { readOnly: true },
		},
		{
			name: "deactivatedAt",
			type: "date",
			label: "Deactivated At",
			admin: { readOnly: true },
		},
		{
			name: "verificationNotes",
			type: "textarea",
			label: "Verification Notes",
			admin: { description: "Internal moderation notes." },
		},
		{
			name: "documents",
			type: "relationship",
			label: "Verification Documents",
			relationTo: "vault",
			hasMany: true,
		},
	],
};

export { WajakaziProfiles };
