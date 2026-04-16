import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// ---------------------------------------------------------------------------
// types — Safaricom callback payload shapes
// ---------------------------------------------------------------------------

interface CallbackMetadataItem {
	Name: string;
	Value: string | number;
}

// success and failure shapes differ — only success carries CallbackMetadata
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

// ---------------------------------------------------------------------------
// helper
// ---------------------------------------------------------------------------

// Safaricom delivers transaction metadata as a flat array of name/value pairs —
// this avoids repeatedly inlining the same find() logic at each extraction site
const getMetadataValue = (
	items: CallbackMetadataItem[],
	name: string,
): string | number | undefined => {
	return items.find((item) => item.Name === name)?.Value;
};

// ---------------------------------------------------------------------------
// POST /apis/payments/callback
// ---------------------------------------------------------------------------
// receives the async STK push result from Safaricom after the user responds
// to the phone prompt. this endpoint is unauthenticated — Safaricom calls it
// directly, so it must always return 200 or Safaricom will retry indefinitely.

export const POST = async (req: Request) => {
	const payload = await getPayload({ config });

	try {
		let body: SafaricomCallbackPayload;

		try {
			body = await req.json();
		} catch {
			// malformed body — acknowledge immediately so Safaricom does not retry
			console.error("[payments/callback] failed to parse request body");
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		const stkCallback = body?.Body?.stkCallback;

		// a missing CheckoutRequestID means we have nothing to correlate — accept and discard
		if (!stkCallback?.CheckoutRequestID) {
			console.error("[payments/callback] missing stkCallback or CheckoutRequestID", body);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc } = stkCallback;

		console.log(
			`[payments/callback] received — CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`,
		);

		// match against the record we created when the STK push was initiated
		const paymentResult = await payload.find({
			collection: "payments",
			where: { checkoutRequestId: { equals: CheckoutRequestID } },
			limit: 1,
		});

		const payment = paymentResult.docs[0];

		if (!payment) {
			// could be a Safaricom replay for a request we have no record of — accept and discard
			console.error(
				`[payments/callback] no payment record found for CheckoutRequestID: ${CheckoutRequestID}`,
			);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// the Inngest timeout or a previous callback delivery may have already resolved
		// this payment — processing it again would corrupt the record
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

		if (ResultCode === 0) {
			// ResultCode 0 is the only success code — cast is safe here
			const successCallback = stkCallback as STKCallbackSuccess;
			const items = successCallback.CallbackMetadata?.Item ?? [];

			// receipt number is the primary audit reference for the transaction
			const mpesaReceiptNumber = getMetadataValue(items, "MpesaReceiptNumber") as
				| string
				| undefined;

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

			// downstream effects are branched by payment type so this route can
			// handle future payment types without touching the success path above
			if (payment.paymentType === "registration") {
				await handleRegistrationConfirmed(payload, payment.account);
			} else if (payment.paymentType === "subscription") {
				// subscription activation is deferred to phase 4 — log and continue
				console.log(
					`[payments/callback] subscription payment confirmed — activation deferred to phase 4`,
				);
			}

			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// any non-zero ResultCode is a failure
		// common codes: 1032 user cancelled, 1037 unreachable, 1 insufficient funds, 2001 wrong PIN
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

		// a failed payment does not change verificationStatus — the Mjakazi stays in
		// pending_payment and can initiate a fresh STK push without any admin intervention

		return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
	} catch (error) {
		// never let an unhandled error surface a non-200 — Safaricom would retry indefinitely
		console.error("[payments/callback] unhandled error:", error);
		return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
	}
};

// ---------------------------------------------------------------------------
// handleRegistrationConfirmed
// ---------------------------------------------------------------------------

// separated from the main handler so the success path stays readable as more
// payment types are added — each type gets its own function with its own logic
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

	// Payload may return the relation as a populated object or a raw id string
	// depending on query depth — normalise before using
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

	// a concurrent callback delivery or Inngest run may have already moved the profile —
	// only advance from the state we expect to prevent clobbering a later state
	if (profile.verificationStatus !== "pending_payment") {
		console.log(
			`[payments/callback] profile not in pending_payment — current status: ${profile.verificationStatus}, skipping`,
		);
		return;
	}

	// payment confirmed — hand the Mjakazi off to the admin review queue
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
