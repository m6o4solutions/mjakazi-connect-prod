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
// triggers an M-Pesa STK push for a mjakazi registration payment
// expects: { phoneNumber: string }
// returns: { checkoutRequestId, merchantRequestId, message }

export const POST = async (req: Request) => {
	try {
		// reject unauthenticated requests early — nothing below is public
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
		}

		const payload = await getPayload({ config });

		// look up the account so we can check role and link the payment record
		const accountResult = await payload.find({
			collection: "accounts",
			where: { clerkId: { equals: userId } },
			limit: 1,
		});

		const account = accountResult.docs[0];

		if (!account) {
			return NextResponse.json({ error: "Account not found" }, { status: 404 });
		}

		// registration payments only apply to mjakazi accounts — guard against
		// employers or admins accidentally hitting this endpoint
		if (account.role !== "mjakazi") {
			return NextResponse.json(
				{ error: "Only Mjakazi accounts can initiate registration payments" },
				{ status: 403 },
			);
		}

		// verificationStatus lives on the wajakaziprofile, not the account,
		// so we fetch it separately
		const profileResult = await payload.find({
			collection: "wajakaziprofiles",
			where: { account: { equals: account.id } },
			limit: 1,
		});

		const profile = profileResult.docs[0];

		if (!profile) {
			return NextResponse.json({ error: "Mjakazi profile not found" }, { status: 404 });
		}

		// prevent duplicate or out-of-order payment attempts — the profile must
		// have reached pending_payment before a charge is allowed
		if (profile.verificationStatus !== "pending_payment") {
			return NextResponse.json(
				{ error: "Account is not in a payable state" },
				{ status: 409 },
			);
		}

		// always read the fee live from the global so any admin change takes
		// effect immediately without a deploy; fall back to 1500 KES if unset
		const platformSettings = await payload.findGlobal({
			slug: "platform-settings",
			overrideAccess: true,
		});

		const registrationFee = platformSettings?.registrationFee ?? 1500;

		// parse the body here rather than at the top so we only consume the
		// stream after all eligibility checks have passed
		const body = await req.json();
		const { phoneNumber } = body;

		if (!phoneNumber || typeof phoneNumber !== "string") {
			return NextResponse.json(
				{ error: "A valid M-Pesa phone number is required" },
				{ status: 400 },
			);
		}

		// normalise before validating so the check works regardless of whether
		// the caller sends 07…, 254…, or +254…
		const normalised = normaliseMpesaPhone(phoneNumber);

		if (!isValidKenyanMobileNumber(normalised)) {
			return NextResponse.json(
				{ error: "Phone number must be a valid Kenyan mobile number" },
				{ status: 400 },
			);
		}

		// send the STK push — this returns Daraja identifiers we need to store
		// and later correlate with the callback
		const stkResponse = await initiateSTKPush({
			phoneNumber: normalised,
			amount: registrationFee,
			accountReference: "MjakaziReg",
			transactionDesc: "Mjakazi Connect Registration Fee",
		});

		// persist immediately so the callback handler can find this record even
		// if it arrives before the response below is returned
		const payment = await payload.create({
			collection: "payments",
			data: {
				account: account.id,
				paymentType: "registration",
				amount: registrationFee,
				currency: "KES",
				provider: "mpesa",
				status: "stk_sent",
				phoneNumber: normalised,
				checkoutRequestId: stkResponse.CheckoutRequestID,
				merchantRequestId: stkResponse.MerchantRequestID,
			},
		});

		// schedule the timeout job — if Daraja never calls back within the
		// window, the job marks the payment as expired and unlocks the profile
		await inngest.send({
			name: "payment/stk.sent",
			data: {
				paymentId: payment.id,
				checkoutRequestId: stkResponse.CheckoutRequestID,
				accountId: account.id,
			},
		});

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
