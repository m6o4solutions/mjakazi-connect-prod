import { isSA } from "@/payload/access/access-control";
import type { GlobalConfig } from "payload";

// singleton global for platform-wide configuration that only super-admins
// should be able to view or change — keeps business-critical values out of
// reach for regular admins and prevents accidental edits via the CMS UI
const PlatformSettings: GlobalConfig = {
	slug: "platform-settings",
	label: "Platform Settings",
	access: { read: isSA, update: isSA },
	fields: [
		{
			// base onboarding cost charged to new workers; stored here so it can
			// be adjusted without a code deploy — consumed by the payments flow
			name: "registrationFee",
			type: "number",
			label: "Mjakazi Registration Fee (KSh)",
			required: true,
			defaultValue: 1500,
			min: 1, // prevents accidentally zeroing out the fee
		},
	],
};

export { PlatformSettings };
