import { inngest } from "@/inngest/client";
import { writeAuditLog } from "@/lib/audit";
import config from "@payload-config";
import { getPayload } from "payload";

export const subscriptionTimeout = inngest.createFunction(
	{
		id: "subscription-timeout",
		name: "Subscription STK Push Timeout",
		triggers: [{ event: "subscription/stk.sent" }],
	},
	async ({ event, step }) => {
		const { subscriptionId, checkoutRequestId, accountId, waajiriProfileId } = event.data;

		// give the mwajiri the full window to respond to the stk prompt
		await step.sleep("wait-for-stk-response", "2m");

		// re-fetch after sleep — the callback handler may have already resolved it
		const currentStatus = await step.run("check-subscription-status", async () => {
			const payload = await getPayload({ config });

			const result = await payload.find({
				collection: "subscriptions",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				overrideAccess: true,
				limit: 1,
			});

			const subscription = result.docs[0];
			if (!subscription) return null;

			return subscription.status;
		});

		// callback already resolved this subscription — nothing to do
		if (!currentStatus || currentStatus !== "stk_sent") {
			return {
				outcome: "skipped",
				reason: `Subscription status was already: ${currentStatus}`,
			};
		}

		// still stk_sent after 2 minutes — expire it
		await step.run("expire-subscription-record", async () => {
			const payload = await getPayload({ config });

			await payload.update({
				collection: "subscriptions",
				where: { checkoutRequestId: { equals: checkoutRequestId } },
				data: { status: "expired" },
				overrideAccess: true,
			});

			// resolve account label for the audit entry
			let account = null;

			try {
				account = await payload.findByID({
					collection: "accounts",
					id: accountId,
					overrideAccess: true,
				});
			} catch {
				// account may have been deleted between initiation and timeout
			}

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
					subscriptionId,
					checkoutRequestId,
					paymentType: "subscription",
					reason: "STK Push not responded to within 2 minutes",
				},
				source: "system",
			});
		});

		// reset profile to none so the mwajiri can initiate a fresh attempt
		// without manual intervention — an unanswered prompt is not a hard failure
		await step.run("reset-profile-subscription-status", async () => {
			const payload = await getPayload({ config });

			const profileResult = await payload.find({
				collection: "waajiriprofiles",
				where: { account: { equals: accountId } },
				overrideAccess: true,
				limit: 1,
			});

			const profile = profileResult.docs[0];
			if (!profile) return;

			// a concurrent callback could have activated the subscription between steps
			if (profile.subscriptionStatus !== "pending_payment") return;

			await payload.update({
				collection: "waajiriprofiles",
				id: profile.id,
				data: { subscriptionStatus: "none" },
				overrideAccess: true,
			});
		});

		return {
			outcome: "expired",
			subscriptionId,
			checkoutRequestId,
		};
	},
);
