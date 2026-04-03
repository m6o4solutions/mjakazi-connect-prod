import { PendingVerificationTable } from "@/components/dashboard/admin/pending-verification-table";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const AdminVerificationsPage = async () => {
	// guard: unauthenticated users are sent to sign-in
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });

	// resolve the platform account linked to this Clerk user
	const identity = await resolveIdentity(payload, userId);

	if (!identity) redirect("/sign-in");

	// only admin and sa roles are permitted to review verifications
	if (identity.role !== "admin" && identity.role !== "sa") {
		redirect("/sign-in");
	}

	// load all wajokazi profiles that have been submitted and are awaiting review,
	// sorted by submission time so the oldest requests surface first
	const pendingProfiles = await payload.find({
		collection: "wajakaziprofiles",
		where: { verificationStatus: { equals: "pending_review" } },
		overrideAccess: true,
		depth: 1,
		sort: "-verificationSubmittedAt",
		limit: 100,
	});

	// attach vault documents to each profile so the table can render them
	// without a second round-trip on the client
	const profilesWithDocuments = await Promise.all(
		pendingProfiles.docs.map(async (profile) => {
			const docs = await payload.find({
				collection: "vault",
				where: { profile: { equals: profile.id } },
				overrideAccess: true,
				limit: 10,
			});

			return {
				id: profile.id,
				displayName: profile.displayName,
				profession: profile.profession,
				verificationSubmittedAt: profile.verificationSubmittedAt ?? null,
				verificationAttempts: profile.verificationAttempts ?? 0,
				documents: docs.docs.map((doc: any) => ({
					id: doc.id,
					documentType: doc.documentType,
					filename: doc.filename,
					url: doc.url,
				})),
			};
		}),
	);

	return (
		<>
			<DashboardTopbar title="Pending Verifications" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				<PendingVerificationTable profiles={profilesWithDocuments} />
			</main>
		</>
	);
};

export { AdminVerificationsPage as default };
