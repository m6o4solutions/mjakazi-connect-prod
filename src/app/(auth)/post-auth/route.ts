import { retry } from "@/lib/retry";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

// handles post-authentication redirection based on user roles and identity
const GET = async () => {
	const { userId } = await auth();

	if (!userId) redirect("/");

	const payload = await getPayload({ config });
	const identity = await retry(() => resolveIdentity(payload, userId));

	if (!identity) redirect("/");

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

export { GET };
