import { resolveIdentity } from "@/services/identity.service";
import { auth, clerkClient } from "@clerk/nextjs/server";
import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

const DELETE = async (req: Request) => {
	// ensure the caller is authenticated
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
	}

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) {
		return NextResponse.json({ error: "Identity not found." }, { status: 404 });
	}

	// only admins and super-admins may use this endpoint
	if (identity.role !== "admin" && identity.role !== "sa") {
		return NextResponse.json({ error: "Forbidden." }, { status: 403 });
	}

	const body = await req.json();
	const { clerkId, role } = body;

	if (!clerkId || !role) {
		return NextResponse.json(
			{ error: "clerkId and role are required." },
			{ status: 400 },
		);
	}

	// prevent deleting own account via this endpoint
	if (clerkId === userId) {
		return NextResponse.json(
			{ error: "You cannot delete your own account." },
			{ status: 400 },
		);
	}

	// staff accounts require elevated access to delete; block here to avoid accidental removal
	if (role === "admin" || role === "sa") {
		return NextResponse.json(
			{ error: "Staff accounts must be managed from the SA dashboard." },
			{ status: 403 },
		);
	}

	try {
		// look up the account record so we can reach associated profile data
		const accountQuery = await payload.find({
			collection: "accounts",
			where: { clerkId: { equals: clerkId } },
			overrideAccess: true,
			limit: 1,
		});

		if (accountQuery.docs.length === 0) {
			return NextResponse.json({ error: "Account not found" }, { status: 404 });
		}

		const account = accountQuery.docs[0];

		// --- mjakazi cleanup ---
		if (role === "mjakazi") {
			const profileQuery = await payload.find({
				collection: "wajakaziprofiles",
				where: { account: { equals: account.id } },
				overrideAccess: true,
				limit: 1,
			});

			if (profileQuery.docs.length > 0) {
				const profile = profileQuery.docs[0];

				// remove all vault documents and their associated s3 objects before deleting the profile
				const vaultDocs = await payload.find({
					collection: "vault",
					where: { profile: { equals: profile.id } },
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

				// clean up the profile photo from media storage if one was uploaded
				if (profile.photo) {
					const photoId =
						typeof profile.photo === "object" ? (profile.photo as any).id : profile.photo;

					await payload.delete({
						collection: "media",
						id: photoId,
						overrideAccess: true,
					});
				}

				// remove the profile record itself
				await payload.delete({
					collection: "wajakaziprofiles",
					id: profile.id,
					overrideAccess: true,
				});
			}
		}

		// --- mwajiri cleanup ---
		if (role === "mwajiri") {
			const profileQuery = await payload.find({
				collection: "waajiriprofiles",
				where: { account: { equals: account.id } },
				overrideAccess: true,
				limit: 1,
			});

			if (profileQuery.docs.length > 0) {
				await payload.delete({
					collection: "waajiriprofiles",
					id: profileQuery.docs[0].id,
					overrideAccess: true,
				});
			}
		}

		// deleting from clerk fires the user.deleted webhook, which in turn removes
		// the accounts record through the deleteClerkUser handler — no manual cleanup needed here
		const client = await clerkClient();
		await client.users.deleteUser(clerkId);

		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
};

export { DELETE };
