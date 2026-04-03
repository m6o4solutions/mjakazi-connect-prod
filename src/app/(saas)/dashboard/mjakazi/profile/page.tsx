import { ProfileForm } from "@/components/dashboard/mjakazi/profile-form";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	// fetch full profile to read display name and current photo
	const profileQuery = await payload.find({
		collection: "wajakaziprofiles",
		where: { account: { equals: identity.accountId } },
		overrideAccess: true,
		depth: 1,
		limit: 1,
	});

	const profile = profileQuery.docs[0] ?? null;
	const currentDisplayName = profile?.displayName ?? "New Worker";

	// extract the photo URL — photo is a relationship to media
	// depth: 1 populates the full media document
	const photoUrl =
		profile?.photo && typeof profile.photo === "object" && "url" in profile.photo
			? (profile.photo as any).url
			: null;

	return (
		<>
			<DashboardTopbar title="My Profile" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2">
					<ProfileForm
						currentDisplayName={currentDisplayName}
						currentPhotoUrl={photoUrl}
					/>
				</div>
			</main>
		</>
	);
};

export { Page as default };
