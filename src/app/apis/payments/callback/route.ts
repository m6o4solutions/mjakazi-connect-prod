import { writeAuditLog } from "@/lib/audit";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

interface CallbackMetadataItem {
	Name: string;
	Value: string | number;
}

interface STKCallbackSuccess {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResultCode: 0;
	ResultDesc: string;
	CallbackMetadata: {
		Item: CallbackMetadataItem[];
	};
}

interface STKCallbackFailure {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResultCode: number;
	ResultDesc: string;
}

type STKCallback = STKCallbackSuccess | STKCallbackFailure;

interface SafaricomCallbackPayload {
	Body: {
		stkCallback: STKCallback;
	};
}

const getMetadataValue = (
	items: CallbackMetadataItem[],
	name: string,
): string | number | undefined => {
	return items.find((item) => item.Name === name)?.Value;
};

// public endpoint for safaricom to deliver m-pesa payment status updates
export const POST = async (req: Request) => {
	const payload = await getPayload({ config });

	try {
		let body: SafaricomCallbackPayload;

		try {
			body = await req.json();
		} catch {
			console.error("[payments/callback] failed to parse request body");
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		const stkCallback = body?.Body?.stkCallback;

		if (!stkCallback?.CheckoutRequestID) {
			console.error("[payments/callback] missing stkCallback or CheckoutRequestID", body);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

		console.log(
			`[payments/callback] received — CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`,
		);

		const paymentResult = await payload.find({
			collection: "payments",
			where: { checkoutRequestId: { equals: CheckoutRequestID } },
			limit: 1,
		});

		const payment = paymentResult.docs[0];

		if (!payment) {
			console.error(
				`[payments/callback] no payment record found for CheckoutRequestID: ${CheckoutRequestID}`,
			);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// prevent re-processing transactions that have already reached a terminal state
		if (
			payment.status === "confirmed" ||
			payment.status === "failed" ||
			payment.status === "expired"
		) {
			console.log(
				`[payments/callback] already processed — status: ${payment.status}, skipping`,
			);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// resolve account for audit labelling — payment.account may be a string or object
		const accountId =
			typeof payment.account === "object" ? (payment.account as any).id : payment.account;

		const accountResult = await payload.find({
			collection: "accounts",
			where: { id: { equals: accountId } },
			overrideAccess: true,
			limit: 1,
		});

		const account = accountResult.docs[0] ?? null;
		const actorLabel = account
			? [account.firstName, account.lastName].filter(Boolean).join(" ").trim() ||
				account.email
			: accountId;

		if (ResultCode === 0) {
			const successCallback = stkCallback as STKCallbackSuccess;
			const items = successCallback.CallbackMetadata?.Item ?? [];

			const mpesaReceiptNumber = getMetadataValue(items, "MpesaReceiptNumber") as
				| string
				| undefined;

			// update the payment record with m-pesa receipt details upon successful transaction
			await payload.update({
				collection: "payments",
				where: { checkoutRequestId: { equals: CheckoutRequestID } },
				data: {
					status: "confirmed",
					mpesaReceiptNumber: mpesaReceiptNumber ?? null,
					resultCode: String(ResultCode),
					resultDesc: ResultDesc,
				},
			});

			console.log(
				`[payments/callback] payment confirmed — receipt: ${mpesaReceiptNumber}`,
			);

			await writeAuditLog({
				action: "payment_confirmed",
				actorId: account?.id ?? null,
				actorLabel,
				targetId: account?.id ?? null,
				targetLabel: actorLabel,
				metadata: {
					paymentId: payment.id,
					paymentType: payment.paymentType,
					amount: payment.amount,
					currency: payment.currency,
					mpesaReceiptNumber: mpesaReceiptNumber ?? null,
					checkoutRequestId: CheckoutRequestID,
				},
				source: "system",
			});

			// advance the user's workflow based on the specific payment type
			if (payment.paymentType === "registration") {
				await handleRegistrationConfirmed(payload, payment.account);
			} else if (payment.paymentType === "subscription") {
				console.log(
					`[payments/callback] subscription payment confirmed — activation deferred to phase 4`,
				);
			}

			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// record transaction failure details if the user cancelled or the push failed
		await payload.update({
			collection: "payments",
			where: { checkoutRequestId: { equals: CheckoutRequestID } },
			data: {
				status: "failed",
				resultCode: String(ResultCode),
				resultDesc: ResultDesc,
			},
		});

		console.log(
			`[payments/callback] payment failed — ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`,
		);

		await writeAuditLog({
			action: "payment_failed",
			actorId: account?.id ?? null,
			actorLabel,
			targetId: account?.id ?? null,
			targetLabel: actorLabel,
			metadata: {
				paymentId: payment.id,
				paymentType: payment.paymentType,
				amount: payment.amount,
				currency: payment.currency,
				resultCode: String(ResultCode),
				resultDesc: ResultDesc,
				checkoutRequestId: CheckoutRequestID,
			},
			source: "system",
		});

		return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
	} catch (error) {
		console.error("[payments/callback] unhandled error:", error);
		return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
	}
};

// promotes a mjakazi profile to review status once the registration fee is settled
const handleRegistrationConfirmed = async (
	payload: Awaited<ReturnType<typeof getPayload>>,
	accountRef: string | { id: string } | null | undefined,
) => {
	if (!accountRef) {
		console.error(
			"[payments/callback] handleRegistrationConfirmed — no account reference on payment record",
		);
		return;
	}

	const accountId = typeof accountRef === "object" ? accountRef.id : accountRef;

	const profileResult = await payload.find({
		collection: "wajakaziprofiles",
		where: { account: { equals: accountId } },
		limit: 1,
	});

	const profile = profileResult.docs[0];

	if (!profile) {
		console.error(
			`[payments/callback] no mjakazi profile found for account: ${accountId}`,
		);
		return;
	}

	if (profile.verificationStatus !== "pending_payment") {
		console.log(
			`[payments/callback] profile not in pending_payment — current status: ${profile.verificationStatus}, skipping`,
		);
		return;
	}

	await payload.update({
		collection: "wajakaziprofiles",
		id: profile.id,
		data: {
			verificationStatus: "pending_review",
			verificationSubmittedAt: new Date().toISOString(),
		},
	});

	console.log(
		`[payments/callback] profile advanced to pending_review — account: ${accountId}`,
	);
};
