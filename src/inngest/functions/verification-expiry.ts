import { inngest } from "@/inngest/client";
import config from "@payload-config";
import { getPayload } from "payload";

export const verificationExpiry = inngest.createFunction(
	{ id: "verification-expiry-job" },
	{ cron: "0 2 * * *" }, // runs daily at 02:00 UTC
	async ({ step }) => {
		const payload = await getPayload({ config });

		// fetch all verified profiles whose expiry has passed
		const expiredProfiles = await step.run("find-expired-profiles", async () => {
			return payload.find({
				collection: "wajakaziprofiles",
				where: {
					and: [
						{ verificationStatus: { equals: "verified" } },
						{ verificationExpiry: { less_than_equal: new Date().toISOString() } },
					],
				},
				limit: 1000,
			});
		});

		// update each expired profile individually for auditability
		let succeeded = 0;
		let failed = 0;

		for (const profile of expiredProfiles.docs) {
			await step.run(`expire-profile-${profile.id}`, async () => {
				await payload.update({
					collection: "wajakaziprofiles",
					id: profile.id,
					data: { verificationStatus: "verification_expired" },
				});
				succeeded++;
			});
		}

		return {
			processed: expiredProfiles.docs.length,
			succeeded,
			failed,
		};
	},
);
