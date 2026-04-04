import { computeProfileComplete } from "@/lib/compute-profile-complete";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// handles partial updates to a mjakazi worker profile.
// recalculates profile completeness after every save so the client
// always gets an up-to-date completion score without a separate request.
const PATCH = async (req: Request) => {
	const { userId } = await auth();

	// reject unauthenticated requests before touching the database
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		return NextResponse.json({ error: "Identity not found." }, { status: 404 });
	}

	// only mjakazi workers own a profile — employers and admins are excluded
	if (identity.role !== "mjakazi") {
		return NextResponse.json({ error: "Forbidden." }, { status: 403 });
	}

	// a mjakazi account should always have a linked profile, but guard anyway
	if (!identity.wajakaziProfileId) {
		return NextResponse.json({ error: "Profile not found." }, { status: 404 });
	}

	const body = await req.json();

	const {
		displayName,
		photoId,
		bio,
		jobs,
		experience,
		educationLevel,
		languages,
		workPreference,
		availableFrom,
		salaryMin,
		salaryMax,
		location,
		nationality,
		dateOfBirth,
		maritalStatus,
		religion,
	} = body;

	// displayName is the only mandatory field — all others are optional profile details
	if (!displayName?.trim()) {
		return NextResponse.json({ error: "Display name is required." }, { status: 400 });
	}

	// start with the required field; conditionally append optional fields so that
	// omitted keys do not overwrite existing values with undefined
	const updateData: Record<string, any> = { displayName: displayName.trim() };

	if (photoId) updateData.photo = photoId;
	if (bio !== undefined) updateData.bio = bio;
	if (jobs !== undefined) updateData.jobs = jobs;
	if (experience !== undefined) updateData.experience = experience;
	if (educationLevel !== undefined) updateData.educationLevel = educationLevel;
	if (languages !== undefined) updateData.languages = languages;
	if (workPreference !== undefined) updateData.workPreference = workPreference;
	if (availableFrom !== undefined) updateData.availableFrom = availableFrom;
	if (salaryMin !== undefined) updateData.salaryMin = salaryMin;
	if (salaryMax !== undefined) updateData.salaryMax = salaryMax;
	if (location !== undefined) updateData.location = location;
	if (nationality !== undefined) updateData.nationality = nationality;
	if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
	if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
	if (religion !== undefined) updateData.religion = religion;

	try {
		// fetch the persisted profile so the completeness check reflects the full
		// document, not just the fields included in this request
		const currentProfile = await payload.findByID({
			collection: "wajakaziprofiles",
			id: identity.wajakaziProfileId,
			overrideAccess: true,
		});

		// merge saved state with incoming changes before scoring completeness
		const mergedProfile = { ...currentProfile, ...updateData };
		const profileComplete = computeProfileComplete(mergedProfile);

		await payload.update({
			collection: "wajakaziprofiles",
			id: identity.wajakaziProfileId,
			overrideAccess: true,
			data: { ...updateData, profileComplete },
		});

		return NextResponse.json({ success: true, profileComplete });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 400 });
	}
};

export { PATCH };
