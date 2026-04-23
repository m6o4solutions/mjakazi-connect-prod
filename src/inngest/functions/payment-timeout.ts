import { inngest } from "@/inngest/client";
import { writeAuditLog } from "@/lib/audit";
import config from "@payload-config";
import { getPayload } from "payload";

// monitor and expire STK push requests that do not receive a callback within the expected window
export const paymentTimeout = inngest.createFunction(
	{
		id: "payment-timeout",
		name: "Payment STK Push Timeout",
		triggers: [{ event: "payment/stk.sent" }],
	},
	async ({ event, step }) => {
		const { paymentId, checkoutRequestId, accountId } = event.data;

		// allow sufficient time for the provider to process the payment and send a callback
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

		// exit if the payment was already updated by a successful or failed callback
		if (!currentStatus || currentStatus !== "stk_sent") {
			return {
				outcome: "skipped",
				reason: `Payment status was already: ${currentStatus}`,
			};
		}

		await step.run("expire-payment-record", async () => {
			const payload = await getPayload({ config });

			// mark the payment as expired to prevent late callback processing
			await payload.update({
				collection: "payments",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				data: { status: "expired" },
			});

			let account = null;

			try {
				account = await payload.findByID({
					collection: "accounts",
					id: accountId,
					overrideAccess: true,
				});
			} catch {
				// handle cases where the account might have been removed during the wait period
			}

			const actorLabel = account
				? [account.firstName, account.lastName].filter(Boolean).join(" ").trim() ||
					account.email
				: accountId;

			// log the system-initiated expiration for auditing and support visibility
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

			const profileResult = await payload.find({
				collection: "wajakaziprofiles",
				where: { account: { equals: accountId } },
				limit: 1,
			});

			const profile = profileResult.docs[0];

			if (!profile) return;

			// only proceed if the profile is still waiting for this specific payment
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
