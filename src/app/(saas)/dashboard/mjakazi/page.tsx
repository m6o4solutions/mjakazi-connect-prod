import { DocumentUploadCard } from "@/components/dashboard/document-upload-card";
import { SubmitVerificationCard } from "@/components/dashboard/submit-verification-card";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { VerificationProgressCard } from "@/components/dashboard/verification-progress-card";
import { VerificationStatusCard } from "@/components/dashboard/verification-status-card";
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

	const verificationStatus = identity.verificationStatus ?? "draft";

	// query vault to determine which required documents have been uploaded
	const existingDocs = await payload.find({
		collection: "vault",
		where: {
			profile: { equals: identity.wajakaziProfileId },
		},
		overrideAccess: true,
		limit: 10,
	});

	const uploadedTypes = existingDocs.docs.map((doc: any) => doc.documentType);
	const hasNationalId = uploadedTypes.includes("national_id");
	const hasGoodConduct = uploadedTypes.includes("good_conduct");
	const bothUploaded = hasNationalId && hasGoodConduct;

	return (
		<>
			<DashboardTopbar title="My Dashboard" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				{/* status row */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<VerificationStatusCard verificationState={verificationStatus} />
					<VerificationProgressCard status={verificationStatus} />
					{/* activity placeholder */}
					<div className="bg-card border-border rounded-xl border p-6">
						<p className="text-muted-foreground text-sm font-semibold">Activity</p>
						<p className="font-display text-foreground mt-2 text-2xl font-bold">
							Coming Soon
						</p>
						<p className="text-muted-foreground mt-1 text-sm">
							Your recent activity and updates will appear here.
						</p>
					</div>
				</div>

				{/* document upload row */}
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<DocumentUploadCard
						documentType="national_id"
						label="National ID"
						alreadyUploaded={hasNationalId}
					/>
					<DocumentUploadCard
						documentType="good_conduct"
						label="Certificate of Good Conduct"
						alreadyUploaded={hasGoodConduct}
					/>
					<SubmitVerificationCard
						verificationStatus={verificationStatus}
						documentsReady={bothUploaded}
					/>
				</div>
			</main>
		</>
	);
};

export { Page as default };
