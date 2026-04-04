import { DevPaymentBypassCard } from "@/components/dashboard/dev-payment-bypass-card";
import { DocumentUploadCard } from "@/components/dashboard/document-upload-card";
import { LegalNameForm } from "@/components/dashboard/mjakazi/legal-name-form";
import { SubmitVerificationCard } from "@/components/dashboard/submit-verification-card";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const isPaymentBypassEnabled = process.env.ENABLE_PAYMENT_BYPASS === "true";

const LOCKED_STATUSES = ["pending_review", "verified", "blacklisted", "deactivated"];

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	const verificationStatus = identity.verificationStatus ?? "draft";

	// fetch full profile to read legal name fields
	const profileQuery = await payload.find({
		collection: "wajakaziprofiles",
		where: { account: { equals: identity.accountId } },
		overrideAccess: true,
		limit: 1,
	});

	const profile = profileQuery.docs[0] ?? null;
	const legalFirstName = profile?.legalFirstName ?? null;
	const legalLastName = profile?.legalLastName ?? null;
	const isNameLocked = LOCKED_STATUSES.includes(verificationStatus);

	// query vault to determine which required documents have been uploaded
	const existingDocs = await payload.find({
		collection: "vault",
		where: { profile: { equals: identity.wajakaziProfileId } },
		overrideAccess: true,
		limit: 10,
	});

	const uploadedTypes = existingDocs.docs.map((doc: any) => doc.documentType);
	const hasNationalId = uploadedTypes.includes("national_id");
	const hasGoodConduct = uploadedTypes.includes("good_conduct");
	const bothUploaded = hasNationalId && hasGoodConduct;

	const showPaymentBypass =
		isPaymentBypassEnabled && verificationStatus === "pending_payment";

	return (
		<>
			<DashboardTopbar title="Verification" />

			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<LegalNameForm
						currentLegalFirstName={legalFirstName}
						currentLegalLastName={legalLastName}
						isLocked={isNameLocked}
					/>

					{/* dev payment bypass — only renders in development */}
					{showPaymentBypass && <DevPaymentBypassCard />}
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
