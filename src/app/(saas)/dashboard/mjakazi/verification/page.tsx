import { DocumentUploadCard } from "@/components/dashboard/document-upload-card";
import { LegalNameForm } from "@/components/dashboard/mjakazi/legal-name-form";
import { PaymentCard } from "@/components/dashboard/mjakazi/payment-card";
import { SubmitVerificationCard } from "@/components/dashboard/submit-verification-card";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

export const metadata: Metadata = { title: "Verification" };

// once a submission is in review or beyond, the legal name must not change
// as it is tied to the identity documents being assessed
const LOCKED_STATUSES = ["pending_review", "verified", "blacklisted", "deactivated"];

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	// default to "draft" so the page renders correctly before a status is set
	const verificationStatus = identity.verificationStatus ?? "draft";

	// profile holds legal name fields which are managed separately from the
	// clerk account; fetch it to pre-populate the legal name form
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

	// vault documents are fetched server-side so upload cards know which types
	// are already present and hold the ids needed for the replace flow
	const existingDocs = await payload.find({
		collection: "vault",
		where: { profile: { equals: identity.wajakaziProfileId } },
		overrideAccess: true,
		limit: 10,
	});

	const uploadedTypes = existingDocs.docs.map((doc: any) => doc.documentType);
	const hasNationalId = uploadedTypes.includes("national_id");
	const hasGoodConduct = uploadedTypes.includes("good_conduct");
	// both mandatory documents must be present before submission is allowed
	const bothUploaded = hasNationalId && hasGoodConduct;

	// ids are passed down so the replace flow can target the correct vault record
	const nationalIdDoc = existingDocs.docs.find(
		(doc: any) => doc.documentType === "national_id",
	);
	const goodConductDoc = existingDocs.docs.find(
		(doc: any) => doc.documentType === "good_conduct",
	);

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
				</div>

				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					<DocumentUploadCard
						documentType="national_id"
						label="National ID"
						alreadyUploaded={hasNationalId}
						existingDocumentId={nationalIdDoc?.id ?? null}
					/>
					<DocumentUploadCard
						documentType="good_conduct"
						label="Certificate of Good Conduct"
						alreadyUploaded={hasGoodConduct}
						existingDocumentId={goodConductDoc?.id ?? null}
					/>
					<SubmitVerificationCard
						verificationStatus={verificationStatus}
						documentsReady={bothUploaded}
					/>
				</div>

				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{/* payment card is shown when the mjakazi is awaiting payment
					    the dev bypass card has been permanently retired */}
					{verificationStatus === "pending_payment" && <PaymentCard />}
				</div>
			</main>
		</>
	);
};

export { Page as default };
