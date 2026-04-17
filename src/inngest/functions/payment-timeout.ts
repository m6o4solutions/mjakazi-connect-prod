import { inngest } from "@/inngest/client";
import config from "@payload-config";
import { getPayload } from "payload";

// triggered by payment/stk.sent — acts as a safety net for unanswered STK prompts
// if Daraja's callback hasn't arrived within 2 minutes the payment is expired
// and the profile is reset so the Mjakazi can retry without manual intervention

export const paymentTimeout = inngest.createFunction(
	{
		id: "payment-timeout",
		name: "Payment STK Push Timeout",
		triggers: [{ event: "payment/stk.sent" }],
	},
	async ({ event, step }) => {
		const { paymentId, checkoutRequestId, accountId } = event.data;

		// give the user the full window to open their phone and enter their PIN
		await step.sleep("wait-for-stk-response", "2m");

		// re-fetch the record after the sleep — the callback handler may have
		// already resolved it to confirmed or failed while this function was dormant
		const currentStatus = await step.run("check-payment-status", async () => {
			const payload = await getPayload({ config });

			const result = await payload.find({
				collection: "payments",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				limit: 1,
			});

			const payment = result.docs[0];

			// guard against edge cases where the record was deleted or never written
			if (!payment) {
				return null;
			}

			return payment.status;
		});

		// callback already won the race — nothing to do
		// confirmed = user paid, failed = Safaricom rejected, null = record missing
		if (!currentStatus || currentStatus !== "stk_sent") {
			return {
				outcome: "skipped",
				reason: `Payment status was already: ${currentStatus}`,
			};
		}

		// still stk_sent after 2 minutes — user did not respond, mark it expired
		await step.run("expire-payment-record", async () => {
			const payload = await getPayload({ config });

			await payload.update({
				collection: "payments",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				data: { status: "expired" },
			});
		});

		// an unanswered STK prompt is not a payment failure — the Mjakazi should be
		// able to try again immediately, so we leave verificationStatus as pending_payment
		// rather than advancing or penalising the verification state
		await step.run("reset-verification-status", async () => {
			const payload = await getPayload({ config });

			const profileResult = await payload.find({
				collection: "wajakaziprofiles",
				where: { account: { equals: accountId } },
				limit: 1,
			});

			const profile = profileResult.docs[0];

			if (!profile) return;

			// a concurrent callback could have moved the profile forward between steps —
			// only reset if the profile is still in the expected state
			if (profile.verificationStatus !== "pending_payment") return;

			await payload.update({
				collection: "wajakaziprofiles",
				id: profile.id,
				data: { verificationStatus: "pending_payment" },
			});
		});

		return {
			outcome: "expired",
			paymentId,
			checkoutRequestId,
		};
	},
);
