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

// once a submission enters review the legal name is tied to the documents
// being assessed, so it must not change until the cycle is complete
const LOCKED_STATUSES = ["pending_review", "verified", "blacklisted", "deactivated"];

const Page = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// non-mjakazi roles have no verification flow — redirect rather than render
	if (!identity || identity.role !== "mjakazi") redirect("/sign-in");

	// fall back to "draft" so UI state is predictable before a status is assigned
	const verificationStatus = identity.verificationStatus ?? "draft";

	// legal name lives on the profile, not the Clerk account; fetch it so the
	// form can be pre-populated on load
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

	// fetching vault docs server-side lets each upload card know whether a
	// document of that type already exists and supplies the id required to
	// target the correct record during a replace operation
	const existingDocs = await payload.find({
		collection: "vault",
		where: { profile: { equals: identity.wajakaziProfileId } },
		overrideAccess: true,
		limit: 10,
	});

	const uploadedTypes = existingDocs.docs.map((doc: any) => doc.documentType);
	const hasNationalId = uploadedTypes.includes("national_id");
	const hasGoodConduct = uploadedTypes.includes("good_conduct");
	// submission is blocked until both mandatory documents are present
	const bothUploaded = hasNationalId && hasGoodConduct;

	const nationalIdDoc = existingDocs.docs.find(
		(doc: any) => doc.documentType === "national_id",
	);
	const goodConductDoc = existingDocs.docs.find(
		(doc: any) => doc.documentType === "good_conduct",
	);

	// read the fee live so the displayed amount reflects any admin change
	// without requiring a redeploy
	const platformSettings = await payload.findGlobal({
		slug: "platform-settings",
		overrideAccess: true,
	});

	const registrationFee = platformSettings?.registrationFee ?? 1500;

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
					{/* only rendered while the mjakazi is awaiting payment */}
					{verificationStatus === "pending_payment" && (
						<PaymentCard registrationFee={registrationFee} />
					)}
				</div>
			</main>
		</>
	);
};

export { Page as default };
