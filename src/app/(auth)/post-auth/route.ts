import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import payload from "payload";

// handles post-authentication redirection based on user roles and identity
const GET = async () => {
	const { userId } = await auth();

	if (!userId) {
		redirect("/");
	}

	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		redirect("/");
	}

	switch (identity.role) {
		case "mjakazi":
			redirect("/saas/mjakazi");

		case "mwajiri":
			redirect("/saas/mwajiri");

		case "admin":
		case "sa":
			redirect("/admin");

		default:
			redirect("/");
	}
};

export { GET };
