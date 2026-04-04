// centralised option lists keep select values consistent across the app
import {
	COUNTRY_OPTIONS,
	EDUCATION_LEVEL_OPTIONS,
	JOB_OPTIONS,
	LANGUAGE_OPTIONS,
	LOCATION_OPTIONS,
	MARITAL_STATUS_OPTIONS,
	RELIGION_OPTIONS,
	WORK_PREFERENCE_OPTIONS,
} from "@/lib/profile-constants";
// mutations are gated to server-side actions; read is scoped to admins and the profile owner
import { isAdminOrProfileOwner, isRestricted } from "@/payload/access/access-control";
import type { CollectionConfig } from "payload";

// one profile per worker account — drives the public-facing listing and moderation workflow
const WajakaziProfiles: CollectionConfig = {
	slug: "wajakaziprofiles",
	access: {
		// all writes go through server actions so direct API mutations are blocked
		create: isRestricted,
		update: isRestricted,
		delete: isRestricted,
		// workers can only read their own profile; admins see all
		read: isAdminOrProfileOwner,
	},
	admin: {
		useAsTitle: "displayName",
		defaultColumns: [
			"displayName",
			"verificationStatus",
			"profileComplete",
			"createdAt",
			"updatedAt",
		],
		group: "SaaS",
	},
	labels: { singular: "Mjakazi Profile", plural: "Wajakazi Profiles" },
	fields: [
		// --- identity ---

		// ties the profile to a single auth account; uniqueness prevents duplicate profiles
		{
			name: "account",
			type: "relationship",
			label: "Account",
			relationTo: "accounts",
			required: true,
			unique: true,
			index: true,
		},
		// public-facing name shown on listings; indexed for search
		{
			name: "displayName",
			type: "text",
			label: "Display Name",
			required: true,
			index: true,
		},
		// legal name fields are collected for identity verification, not displayed publicly
		{ name: "legalFirstName", type: "text", label: "Legal First Name" },
		{ name: "legalLastName", type: "text", label: "Legal Last Name" },
		// used to derive age and enforce minimum-age rules during verification
		{ name: "dateOfBirth", type: "date", label: "Date of Birth" },
		// nationality informs document requirements during the verification process
		{
			name: "nationality",
			type: "select",
			label: "Nationality",
			options: COUNTRY_OPTIONS.map((c) => ({ label: c.label, value: c.value })),
		},
		{
			name: "maritalStatus",
			type: "select",
			label: "Marital Status",
			options: MARITAL_STATUS_OPTIONS.map((m) => ({ label: m.label, value: m.value })),
		},
		{
			name: "religion",
			type: "select",
			label: "Religion",
			options: RELIGION_OPTIONS.map((r) => ({ label: r.label, value: r.value })),
		},

		// --- photo ---

		// stored in the shared media collection so it can be reused and optimised centrally
		{ name: "photo", type: "upload", label: "Profile Photo", relationTo: "media" },

		// --- professional ---

		// multi-select so a worker can offer several services; indexed to power filtered search
		{
			name: "jobs",
			type: "select",
			label: "Jobs / Skills",
			hasMany: true,
			index: true,
			options: JOB_OPTIONS.map((j) => ({ label: j.label, value: j.value })),
		},
		// free-text introduction shown to employers on the listing card
		{ name: "bio", type: "textarea", label: "About Me" },
		// self-reported; used as a ranking signal in search results
		{ name: "experience", type: "number", label: "Years of Experience", min: 0 },
		{
			name: "educationLevel",
			type: "select",
			label: "Education Level",
			options: EDUCATION_LEVEL_OPTIONS.map((e) => ({ label: e.label, value: e.value })),
		},
		// multi-select so workers can list all languages they communicate in
		{
			name: "languages",
			type: "select",
			label: "Languages Spoken",
			hasMany: true,
			options: LANGUAGE_OPTIONS.map((l) => ({ label: l.label, value: l.value })),
		},

		// --- work preferences ---

		// live-in vs live-out preference; surfaced as a filter on the employer search page
		{
			name: "workPreference",
			type: "select",
			label: "Work Preference",
			options: WORK_PREFERENCE_OPTIONS.map((w) => ({ label: w.label, value: w.value })),
		},
		// lets employers know the earliest start date without having to contact the worker first
		{ name: "availableFrom", type: "date", label: "Available From" },
		// salary range gives employers a quick match/no-match signal before reaching out
		{
			name: "salaryMin",
			type: "number",
			label: "Minimum Expected Salary (KSh)",
			min: 0,
		},
		{
			name: "salaryMax",
			type: "number",
			label: "Maximum Expected Salary (KSh)",
			min: 0,
		},
		// indexed so employers can filter listings by county or area
		{
			name: "location",
			type: "select",
			label: "Location",
			index: true,
			options: LOCATION_OPTIONS.map((l) => ({ label: l.label, value: l.value })),
		},

		// --- availability ---

		// controls whether the profile appears in active search results
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

		// --- verification ---

		// drives the moderation lifecycle: draft → pending_payment → pending_review → verified (or rejected/blacklisted)
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
		// audit timestamps set by server hooks, not editable in the admin UI
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
		// after expiry the worker must re-verify; checked by a scheduled job
		{ name: "verificationExpiry", type: "date", label: "Verification Expiry" },
		// incremented on each submission attempt to detect repeat rejections
		{
			name: "verificationAttempts",
			type: "number",
			label: "Verification Attempts",
			defaultValue: 0,
			admin: { readOnly: true },
		},
		// surfaced to the worker when their submission is rejected so they can correct it
		{ name: "rejectionReason", type: "textarea", label: "Rejection Reason" },
		// set by a hook when the status transitions to blacklisted; read-only to prevent tampering
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
		// private moderator notes; never exposed to the worker
		{
			name: "verificationNotes",
			type: "textarea",
			label: "Verification Notes",
			admin: { description: "Internal moderation notes." },
		},
		// uploaded ID / reference documents stored in the vault collection for access control
		{
			name: "documents",
			type: "relationship",
			label: "Verification Documents",
			relationTo: "vault",
			hasMany: true,
		},

		// --- profile completeness ---

		// computed server-side after each save; gates the worker from submitting for verification
		{
			name: "profileComplete",
			type: "checkbox",
			label: "Profile Complete",
			defaultValue: false,
			admin: {
				readOnly: true,
				description: "Set automatically when all required profile fields are populated.",
			},
		},
	],
};

export { WajakaziProfiles };
