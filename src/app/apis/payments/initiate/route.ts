import { inngest } from "@/inngest/client";
import {
	initiateSTKPush,
	isValidKenyanMobileNumber,
	normaliseMpesaPhone,
} from "@/lib/mpesa";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// POST /apis/payments/initiate
// triggers an M-Pesa STK push for a Mjakazi registration payment
// expects: { phoneNumber: string }
// returns: { checkoutRequestId, merchantRequestId }

export const POST = async (req: Request) => {
	try {
		// gate the entire route behind Clerk — unauthenticated callers get nothing
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
		}

		const payload = await getPayload({ config });

		// resolve the Payload account that belongs to this Clerk user
		const accountResult = await payload.find({
			collection: "accounts",
			where: { clerkId: { equals: userId } },
			limit: 1,
		});

		const account = accountResult.docs[0];

		if (!account) {
			return NextResponse.json({ error: "Account not found" }, { status: 404 });
		}

		// registration payments are only meaningful for Mjakazi accounts
		if (account.role !== "mjakazi") {
			return NextResponse.json(
				{ error: "Only Mjakazi accounts can initiate registration payments" },
				{ status: 403 },
			);
		}

		// verificationStatus lives on the profile, not the account — requires a separate lookup
		const profileResult = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: account.id } },
			limit: 1,
		});

		const profile = profileResult.docs[0];

		if (!profile) {
			return NextResponse.json({ error: "Mjakazi profile not found" }, { status: 404 });
		}

		// guard against duplicate payments — only profiles awaiting payment should proceed
		if (profile.verificationStatus !== "pending_payment") {
			return NextResponse.json(
				{ error: "Account is not in a payable state" },
				{ status: 409 },
			);
		}

		const body = await req.json();
		const { phoneNumber } = body;

		// reject early before hitting Daraja with unusable input
		if (!phoneNumber || typeof phoneNumber !== "string") {
			return NextResponse.json(
				{ error: "A valid M-Pesa phone number is required" },
				{ status: 400 },
			);
		}

		const normalised = normaliseMpesaPhone(phoneNumber);

		// catch non-Safaricom numbers before burning an API call
		if (!isValidKenyanMobileNumber(normalised)) {
			return NextResponse.json(
				{ error: "Phone number must be a valid Kenyan mobile number" },
				{ status: 400 },
			);
		}

		// amount and reference are fixed for registration — not caller-controlled
		const stkResponse = await initiateSTKPush({
			phoneNumber: normalised,
			amount: 1500,
			accountReference: "MjakaziReg",
			transactionDesc: "Mjakazi Connect Registration Fee",
		});

		// payments has endpoints: false — all writes must go through the local API
		// status starts at stk_sent; the callback route or timeout function will advance it
		const payment = await payload.create({
			collection: "payments",
			data: {
				account: account.id,
				paymentType: "registration",
				amount: 1500,
				currency: "KES",
				provider: "mpesa",
				status: "stk_sent",
				phoneNumber: normalised,
				checkoutRequestId: stkResponse.CheckoutRequestID,
				merchantRequestId: stkResponse.MerchantRequestID,
			},
		});

		// start the expiry clock — the Inngest function will mark the payment expired
		// if Daraja's callback hasn't arrived within the allowed window
		await inngest.send({
			name: "payment/stk.sent",
			data: {
				paymentId: payment.id,
				checkoutRequestId: stkResponse.CheckoutRequestID,
				accountId: account.id,
			},
		});

		// the client uses these IDs to poll or match the incoming callback
		return NextResponse.json(
			{
				checkoutRequestId: stkResponse.CheckoutRequestID,
				merchantRequestId: stkResponse.MerchantRequestID,
				message: "STK Push sent. Please check your phone and enter your M-Pesa PIN.",
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("[payments/initiate] error:", error);

		return NextResponse.json(
			{ error: "Payment initiation failed. Please try again." },
			{ status: 500 },
		);
	}
};
