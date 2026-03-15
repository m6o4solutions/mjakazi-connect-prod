import { Button } from "@/components/ui/button";
import { resolveIdentity } from "@/services/identity.service";
import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { getPayload } from "payload";

const Page = async () => {
	const { userId } = await auth();

	if (!userId) return null;

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	const verificationStatus = identity?.verificationStatus ?? "unknown";

	return (
		<div className="bg-bg-subtle flex min-h-screen items-center justify-center p-6">
			<div className="bg-card border-border w-full max-w-lg space-y-6 rounded-lg border p-6">
				<h1 className="font-display text-2xl font-bold">Mjakazi Dashboard</h1>

				<div className="space-y-2">
					<div className="text-muted-foreground text-sm">Verification Status</div>

					<div className="text-lg font-semibold">{verificationStatus}</div>
				</div>

				<div className="pt-4">
					<SignOutButton>
						<Button variant="outline">Sign Out</Button>
					</SignOutButton>
				</div>
			</div>
		</div>
	);
};

export { Page as default };
