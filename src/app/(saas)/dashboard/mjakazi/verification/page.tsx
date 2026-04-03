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

// allows developers to skip payment in local/staging environments
const isPaymentBypassEnabled = process.env.ENABLE_PAYMENT_BYPASS === "true";

// once a submission is under review or beyond, the legal name can no longer be edited
// to prevent workers from changing identity details after documents have been assessed
const LOCKED_STATUSES = ["pending_review", "verified", "blacklisted", "deactivated"];

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	const verificationStatus = identity.verificationStatus ?? "draft";

	// fetch the worker's profile to pre-fill the legal name form
	const profileQuery = await payload.find({
		collection: "wajakaziprofiles",
		where: { account: { equals: identity.accountId } },
		overrideAccess: true,
		limit: 1,
	});

	const profile = profileQuery.docs[0] ?? null;
	const legalFirstName = profile?.legalFirstName ?? null;
	const legalLastName = profile?.legalLastName ?? null;
	// lock the legal name fields once the application is in a non-editable state
	const isNameLocked = LOCKED_STATUSES.includes(verificationStatus);

	// check the vault to know which required document types have already been uploaded
	// so the UI can reflect upload state without the worker having to guess
	const existingDocs = await payload.find({
		collection: "vault",
		where: { profile: { equals: identity.wajakaziProfileId } },
		overrideAccess: true,
		limit: 10,
	});

	const uploadedTypes = existingDocs.docs.map((doc: any) => doc.documentType);
	const hasNationalId = uploadedTypes.includes("national_id");
	const hasGoodConduct = uploadedTypes.includes("good_conduct");
	// both documents must be present before submission is allowed
	const bothUploaded = hasNationalId && hasGoodConduct;

	// only surface the bypass card when the feature flag is on and payment is the blocker
	const showPaymentBypass =
		isPaymentBypassEnabled && verificationStatus === "pending_payment";

	return (
		<>
			<DashboardTopbar title="Verification" />

		<main className="flex flex-1 flex-col gap-6 p-6">
			{/* document upload row — each card manages its own upload independently */}
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
				{/* submit card is disabled until both required documents are uploaded */}
				<SubmitVerificationCard
					verificationStatus={verificationStatus}
					documentsReady={bothUploaded}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				<LegalNameForm
					currentLegalFirstName={legalFirstName}
					currentLegalLastName={legalLastName}
					isLocked={isNameLocked}
				/>

				{/* dev payment bypass — only renders when feature flag is active */}
				{showPaymentBypass && <DevPaymentBypassCard />}
			</div>
		</main>
		</>
	);
};

export { Page as default };
