import { PlatformSettingsForm } from "@/components/dashboard/sa/platform-settings-form";
import { NameUpdateForm } from "@/components/dashboard/settings/name-update-form";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth, currentUser } from "@clerk/nextjs/server";
import config from "@payload-config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

export const metadata: Metadata = { title: "Settings" };

const Page = async () => {
	const { userId } = await auth();

	// unauthenticated users have no business reaching an sa page
	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	// restrict the page to the sa role — any other authenticated user is treated as unauthorised
	if (!identity || identity.role !== "sa") redirect("/sign-in");

	// clerkUser is fetched separately because resolveIdentity only returns the Payload identity record
	const clerkUser = await currentUser();

	// overrideAccess is required here because this is a server render, not an authenticated Payload request
	const platformSettings = await payload.findGlobal({
		slug: "platform-settings",
		overrideAccess: true,
	});

	// fall back to 1500 if the global hasn't been saved yet (e.g. fresh environment)
	const currentRegistrationFee = platformSettings?.registrationFee ?? 1500;

	return (
		<>
			<DashboardTopbar title="Settings" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2">
					<NameUpdateForm
						currentFirstName={clerkUser?.firstName ?? ""}
						currentLastName={clerkUser?.lastName ?? ""}
					/>
					<PlatformSettingsForm currentRegistrationFee={currentRegistrationFee} />
				</div>
			</main>
		</>
	);
};

export { Page as default };
