import { inngest } from "@/inngest/client";
import { sendEoiMjakaziEmail, sendEoiMwajiriEmail } from "@/lib/email";

export const eoiNotification = inngest.createFunction(
	{
		id: "eoi-notification",
		name: "EOI Email Notification",
		triggers: [{ event: "eoi/sent" }],
	},
	async ({ event, step }) => {
		const {
			wajakaziEmail,
			wajakaziFirstName,
			wajakaziPhoneNumber,
			mwajiriEmail,
			mwajiriDisplayName,
			mwajiriOrganization,
		} = event.data;

		// send both emails concurrently as they do not depend on each other
		await step.run("send-eoi-emails", async () => {
			await Promise.all([
				// notify mjakazi of the introduction to prepare for contact
				wajakaziEmail
					? sendEoiMjakaziEmail({
							to: wajakaziEmail,
							firstName: wajakaziFirstName,
							mwajiriDisplayName,
							mwajiriOrganization,
						})
					: Promise.resolve(),

				// confirm to mwajiri and provide contact details for the worker
				mwajiriEmail
					? sendEoiMwajiriEmail({
							to: mwajiriEmail,
							wajakaziFirstName,
							wajakaziPhoneNumber,
							mwajiriDisplayName,
						})
					: Promise.resolve(),
			]);
		});

		return { outcome: "sent" };
	},
);
