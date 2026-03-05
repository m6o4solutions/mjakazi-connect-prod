"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PostAuthClient() {
	const { isLoaded, isSignedIn, user } = useUser();
	const router = useRouter();
	const searchParams = useSearchParams();
	// prevent redundant update calls during the sync process
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		// wait for clerk auth state to initialize
		if (!isLoaded) return;

		// redirect unauthenticated users to the sign-in page
		if (!isSignedIn) {
			router.push("/sign-in");
			return;
		}

		const processAuth = async () => {
			let role = user?.unsafeMetadata?.role as string | undefined;

			// assign role from url parameters if not already set in user metadata
			if (!role) {
				const roleFromUrl = searchParams.get("role");

				if (roleFromUrl === "mjakazi" || roleFromUrl === "mwaajiri") {
					if (isUpdating) return;
					setIsUpdating(true);

					try {
						// persist role selection to clerk metadata for future sessions
						await user.update({
							unsafeMetadata: { role: roleFromUrl },
						});

						// force reload to ensure metadata changes are reflected in the session
						window.location.reload();
						return;
					} catch (error) {
						console.error("Error updating user role:", error);
						setIsUpdating(false);
					}
				}
			}

			// route user to their specific dashboard based on assigned role
			if (role === "mjakazi") {
				router.push("/dashboard/mjakazi");
			} else if (role === "mwaajiri") {
				router.push("/dashboard/mwaajiri");
			} else {
				// fallback to home for users with missing or invalid roles
				router.push("/");
			}
		};

		processAuth();
	}, [isLoaded, isSignedIn, user, searchParams, router, isUpdating]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h2 className="mb-2 text-xl font-semibold">Finalizing sign-in...</h2>
				<p className="text-gray-500">Please wait while we set up your dashboard.</p>
				<div className="border-primary mx-auto mt-4 size-8 animate-spin rounded-full border-b-2"></div>
			</div>
		</div>
	);
}
