import { writeAuditLog } from "@/lib/audit";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

// safaricom callback payload shapes — success and failure differ
interface CallbackMetadataItem {
	Name: string;
	Value: string | number;
}

interface STKCallbackSuccess {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResultCode: 0;
	ResultDesc: string;
	CallbackMetadata: { Item: CallbackMetadataItem[] };
}

interface STKCallbackFailure {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResultCode: number;
	ResultDesc: string;
}

type STKCallback = STKCallbackSuccess | STKCallbackFailure;

interface SafaricomCallbackPayload {
	Body: { stkCallback: STKCallback };
}

const getMetadataValue = (
	items: CallbackMetadataItem[],
	name: string,
): string | number | undefined => items.find((item) => item.Name === name)?.Value;

// this endpoint is unauthenticated — safaricom calls it directly
// must always return 200 or safaricom will retry indefinitely
export const POST = async (req: Request) => {
	const payload = await getPayload({ config });

	try {
		let body: SafaricomCallbackPayload;

		try {
			body = await req.json();
		} catch {
			console.error("[subscriptions/callback] failed to parse request body");
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		const stkCallback = body?.Body?.stkCallback;

		if (!stkCallback?.CheckoutRequestID) {
			console.error("[subscriptions/callback] missing CheckoutRequestID", body);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

		console.log(
			`[subscriptions/callback] received — CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`,
		);

		// match against the record created during initiation
		const subscriptionResult = await payload.find({
			collection: "subscriptions",
			where: { checkoutRequestId: { equals: CheckoutRequestID } },
			overrideAccess: true,
			limit: 1,
		});

		const subscription = subscriptionResult.docs[0];

		if (!subscription) {
			console.error(
				`[subscriptions/callback] no subscription record found for CheckoutRequestID: ${CheckoutRequestID}`,
			);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// idempotency guard — the inngest timeout or a previous delivery may have
		// already resolved this subscription
		if (
			subscription.status === "active" ||
			subscription.status === "failed" ||
			subscription.status === "expired"
		) {
			console.log(
				`[subscriptions/callback] already processed — status: ${subscription.status}, skipping`,
			);
			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// resolve account for audit labelling
		const accountId =
			typeof subscription.account === "object"
				? (subscription.account as any).id
				: subscription.account;

		const accountResult = await payload.findByID({
			collection: "accounts",
			id: accountId,
			overrideAccess: true,
		});

		const actorLabel = accountResult
			? [accountResult.firstName, accountResult.lastName]
					.filter(Boolean)
					.join(" ")
					.trim() || accountResult.email
			: accountId;

		if (ResultCode === 0) {
			const successCallback = stkCallback as STKCallbackSuccess;
			const items = successCallback.CallbackMetadata?.Item ?? [];
			const mpesaReceiptNumber = getMetadataValue(items, "MpesaReceiptNumber") as
				| string
				| undefined;

			// calculate the subscription window from now using the duration
			// captured at purchase time — not dependent on platform settings still existing
			const startDate = new Date();
			const durationDays =
				typeof subscription.durationDays === "number" ? subscription.durationDays : 30;
			const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

			await payload.update({
				collection: "subscriptions",
				id: subscription.id,
				data: {
					status: "active",
					mpesaReceiptNumber: mpesaReceiptNumber ?? null,
					resultCode: String(ResultCode),
					resultDesc: ResultDesc,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
				},
				overrideAccess: true,
			});

			console.log(
				`[subscriptions/callback] subscription activated — receipt: ${mpesaReceiptNumber}`,
			);

			// update the mwajiri profile so the dashboard reflects active state
			// without querying the subscriptions collection on every render
			await activateMwajiriProfile(payload, accountId, {
				subscriptionId: subscription.id,
				tierName: subscription.tierName,
				endDate: endDate.toISOString(),
			});

			await writeAuditLog({
				action: "payment_confirmed",
				actorId: accountId,
				actorLabel,
				targetId: accountId,
				targetLabel: actorLabel,
				metadata: {
					subscriptionId: subscription.id,
					paymentType: "subscription",
					tierId: subscription.tierId,
					tierName: subscription.tierName,
					amount: subscription.amount,
					currency: subscription.currency,
					mpesaReceiptNumber: mpesaReceiptNumber ?? null,
					checkoutRequestId: CheckoutRequestID,
				},
				source: "system",
			});

			return NextResponse.json(
				{ ResultCode: 0, ResultDesc: "Accepted" },
				{ status: 200 },
			);
		}

		// non-zero result code — payment failed
		// leave profile in pending_payment so the mwajiri can retry
		await payload.update({
			collection: "subscriptions",
			id: subscription.id,
			data: {
				status: "failed",
				resultCode: String(ResultCode),
				resultDesc: ResultDesc,
			},
			overrideAccess: true,
		});

		// reset profile subscription status so the mwajiri can retry
		await resetMwajiriProfileToPending(payload, accountId);

		console.log(
			`[subscriptions/callback] payment failed — ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`,
		);

		await writeAuditLog({
			action: "payment_failed",
			actorId: accountId,
			actorLabel,
			targetId: accountId,
			targetLabel: actorLabel,
			metadata: {
				subscriptionId: subscription.id,
				paymentType: "subscription",
				tierId: subscription.tierId,
				amount: subscription.amount,
				resultCode: String(ResultCode),
				resultDesc: ResultDesc,
				checkoutRequestId: CheckoutRequestID,
			},
			source: "system",
		});

		return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
	} catch (error) {
		// never surface a non-200 — safaricom would retry indefinitely
		console.error("[subscriptions/callback] unhandled error:", error);
		return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
	}
};

// updates the mwajiri profile to reflect an active subscription
// denormalises key fields so the dashboard never needs a subscriptions join
const activateMwajiriProfile = async (
	payload: Awaited<ReturnType<typeof getPayload>>,
	accountId: string,
	data: {
		subscriptionId: string;
		tierName: string;
		endDate: string;
	},
) => {
	const profileResult = await payload.find({
		collection: "waajiriprofiles",
		where: { account: { equals: accountId } },
		overrideAccess: true,
		limit: 1,
	});

	const profile = profileResult.docs[0];

	if (!profile) {
		console.error(
			`[subscriptions/callback] no mwajiri profile found for account: ${accountId}`,
		);
		return;
	}

	await payload.update({
		collection: "waajiriprofiles",
		id: profile.id,
		data: {
			subscriptionStatus: "active",
			activeSubscription: data.subscriptionId,
			subscriptionEndDate: data.endDate,
			subscriptionTierName: data.tierName,
		},
		overrideAccess: true,
	});

	console.log(
		`[subscriptions/callback] mwajiri profile activated — account: ${accountId}`,
	);
};

// resets the profile to none on payment failure so the mwajiri
// can initiate a fresh subscription attempt from the dashboard
const resetMwajiriProfileToPending = async (
	payload: Awaited<ReturnType<typeof getPayload>>,
	accountId: string,
) => {
	const profileResult = await payload.find({
		collection: "waajiriprofiles",
		where: { account: { equals: accountId } },
		overrideAccess: true,
		limit: 1,
	});

	const profile = profileResult.docs[0];
	if (!profile) return;

	await payload.update({
		collection: "waajiriprofiles",
		id: profile.id,
		data: { subscriptionStatus: "none" },
		overrideAccess: true,
	});
};
