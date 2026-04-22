import { inngest } from "@/inngest/client";
import { writeAuditLog } from "@/lib/audit";
import config from "@payload-config";
import { getPayload } from "payload";

// background function to handle payments that never receive a callback from safaricom
export const paymentTimeout = inngest.createFunction(
	{
		id: "payment-timeout",
		name: "Payment STK Push Timeout",
		triggers: [{ event: "payment/stk.sent" }],
	},
	async ({ event, step }) => {
		const { paymentId, checkoutRequestId, accountId } = event.data;

		// wait for a 2-minute window before checking the transaction status
		// this aligns with the typical m-pesa stk push timeout on the user's handset
		await step.sleep("wait-for-stk-response", "2m");

		const currentStatus = await step.run("check-payment-status", async () => {
			const payload = await getPayload({ config });

			const result = await payload.find({
				collection: "payments",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				limit: 1,
			});

			const payment = result.docs[0];

			if (!payment) return null;

			return payment.status;
		});

		// skip expiration if the payment was already confirmed or failed via callback
		if (!currentStatus || currentStatus !== "stk_sent") {
			return {
				outcome: "skipped",
				reason: `Payment status was already: ${currentStatus}`,
			};
		}

		await step.run("expire-payment-record", async () => {
			const payload = await getPayload({ config });

			// mark the payment as expired to prevent late callbacks from being processed
			await payload.update({
				collection: "payments",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				data: { status: "expired" },
			});

			// resolve account label for the audit entry
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

			await writeAuditLog({
				action: "payment_expired",
				actorId: account?.id ?? null,
				actorLabel,
				targetId: account?.id ?? null,
				targetLabel: actorLabel,
				metadata: {
					paymentId,
					checkoutRequestId,
					reason: "STK Push not responded to within 2 minutes",
				},
				source: "system",
			});
		});

		await step.run("reset-verification-status", async () => {
			const payload = await getPayload({ config });

			// ensure the profile remains in pending_payment state so the user can retry
			const profileResult = await payload.find({
				collection: "wajakaziprofiles",
				where: { account: { equals: accountId } },
				limit: 1,
			});

			const profile = profileResult.docs[0];

			if (!profile) return;

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
