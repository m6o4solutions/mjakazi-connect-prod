import { retry } from "@/lib/retry";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { Suspense } from "react";

// The fallback UI streamed instantly to the browser
const LoadingUI = () => {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
			<Loader2 className="text-primary size-10 animate-spin" />
			<div>
				<h2 className="text-xl font-semibold">Authenticating...</h2>
				<p className="text-muted-foreground text-sm">
					Please wait while we prepare your dashboard.
				</p>
			</div>
		</div>
	);
};

// the async component that executes the blocking database operations
const AuthRouter = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/");

	const payload = await getPayload({ config });
	const identity = await retry(() => resolveIdentity(payload, userId));

	if (!identity) redirect("/");

	// route based on validated domain identity
	switch (identity.role) {
		case "mjakazi":
			redirect("/dashboard/mjakazi");
		case "mwajiri":
			redirect("/dashboard/mwajiri");
		case "admin":
		case "sa":
			redirect("/dashboard/admin");
		default:
			redirect("/");
	}
};

// the main page shell wrapping the async logic in Suspense
const Page = () => {
	return (
		<Suspense fallback={<LoadingUI />}>
			<AuthRouter />
		</Suspense>
	);
};

export { Page as default };
