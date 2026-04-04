// a wajakazi profile is considered complete only when every field required
// for public directory visibility has been filled in — this drives whether
// the profile appears in search results and listings

const computeProfileComplete = (profile: any): boolean => {
	// nothing to evaluate if the profile doesn't exist yet
	if (!profile) return false;

	// a photo is required so the profile has a visual presence in the directory
	if (!profile.photo) return false;

	// legal name is required for identity verification and display purposes
	if (!profile.legalFirstName?.trim()) return false;
	if (!profile.legalLastName?.trim()) return false;

	// bio tells employers who the worker is — an empty string is treated as absent
	if (!profile.bio?.trim()) return false;

	// at least one job category must be selected so the profile can be matched to relevant listings
	if (!profile.jobs || profile.jobs.length === 0) return false;

	// location is needed to surface the worker in geographically relevant searches
	if (!profile.location) return false;

	// work preference (e.g. full-time, part-time) determines which opportunities the worker is eligible for
	if (!profile.workPreference) return false;

	// experience of 0 is valid, but the field must be explicitly set — null/undefined means it was skipped
	if (profile.experience === null || profile.experience === undefined) return false;

	// nationality is required for compliance and eligibility checks
	if (!profile.nationality) return false;

	// at least one language ensures the worker can be matched by communication requirements
	if (!profile.languages || profile.languages.length === 0) return false;

	return true;
};

export { computeProfileComplete };
