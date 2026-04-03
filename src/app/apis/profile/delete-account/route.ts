import { resolveIdentity } from "@/services/identity.service";
import { auth, clerkClient } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

const DELETE = async () => {
	const { userId } = await auth();

	// reject unauthenticated requests before touching the database
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		return NextResponse.json({ error: "Identity not found" }, { status: 404 });
	}

	// only end-user roles can self-delete; admin and sa accounts
	// are managed exclusively through the sa dashboard
	if (identity.role !== "mjakazi" && identity.role !== "mwajiri") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		// --- mjakazi cleanup ---
		if (identity.role === "mjakazi" && identity.wajakaziProfileId) {
			// delete all vault documents first — payload.delete on an upload
			// collection removes both the mongodb record and the s3 object
			const vaultDocs = await payload.find({
				collection: "vault",
				where: { profile: { equals: identity.wajakaziProfileId } },
				overrideAccess: true,
				limit: 100,
			});

			await Promise.all(
				vaultDocs.docs.map((doc) =>
					payload.delete({
						collection: "vault",
						id: doc.id,
						overrideAccess: true,
					}),
				),
			);

			// delete profile photo from media if one was uploaded
			const profileDoc = await payload.findByID({
				collection: "wajakaziprofiles",
				id: identity.wajakaziProfileId,
				overrideAccess: true,
			});

			if (profileDoc?.photo) {
				const photoId =
					typeof profileDoc.photo === "object" ? profileDoc.photo.id : profileDoc.photo;

				await payload.delete({
					collection: "media",
					id: photoId,
					overrideAccess: true,
				});
			}

			// remove the profile record after its attached files are gone
			await payload.delete({
				collection: "wajakaziprofiles",
				id: identity.wajakaziProfileId,
				overrideAccess: true,
			});
		}

		// --- mwajiri cleanup ---
		if (identity.role === "mwajiri" && identity.waajiriProfileId) {
			// mwajiri has no vault documents, so only the profile record needs removing
			await payload.delete({
				collection: "waajiriprofiles",
				id: identity.waajiriProfileId,
				overrideAccess: true,
			});
		}

		// deleting from Clerk triggers the user.deleted webhook, which
		// calls deleteClerkUser and removes the corresponding accounts record
		const client = await clerkClient();
		await client.users.deleteUser(userId);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
};

export { DELETE };
