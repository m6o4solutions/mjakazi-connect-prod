import { ProfileForm } from "@/components/dashboard/mjakazi/profile-form";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const Page = async () => {
	const { userId } = await auth();

	// unauthenticated users have no business here
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// only mjakazi-role accounts are allowed on this dashboard section
	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	// fetch the single profile record tied to this account
	const profileQuery = await payload.find({
		collection: "wajakaziprofiles",
		where: { account: { equals: identity.accountId } },
		overrideAccess: true,
		depth: 1, // populate photo relation so we can read its url
		limit: 1,
	});

	const profile = profileQuery.docs[0] ?? null;

	// photo is a relation that resolves to a media object; extract the url safely
	const photoUrl =
		profile?.photo && typeof profile.photo === "object" && "url" in profile.photo
			? (profile.photo as any).url
			: null;

	return (
		<>
			<DashboardTopbar title="My Profile" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2">
					{/* seed the form with existing values so the user sees current data on load */}
					<ProfileForm
						currentDisplayName={profile?.displayName ?? ""}
						currentPhotoUrl={photoUrl}
						currentBio={profile?.bio ?? ""}
						currentJobs={(profile?.jobs as string[]) ?? []}
						currentExperience={profile?.experience ?? null}
						currentEducationLevel={profile?.educationLevel ?? ""}
						currentLanguages={(profile?.languages as string[]) ?? []}
						currentWorkPreference={profile?.workPreference ?? ""}
						currentAvailableFrom={profile?.availableFrom ?? ""}
						currentSalaryMin={profile?.salaryMin ?? null}
						currentSalaryMax={profile?.salaryMax ?? null}
						currentLocation={profile?.location ?? ""}
						currentNationality={profile?.nationality ?? ""}
						currentDateOfBirth={profile?.dateOfBirth ?? ""}
						currentMaritalStatus={profile?.maritalStatus ?? ""}
						currentReligion={profile?.religion ?? ""}
					/>
				</div>
			</main>
		</>
	);
};

export { Page as default };
