"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PostAuthPage = () => {
	const { isLoaded, isSignedIn, user } = useUser();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		// wait for clerk to initialize before checking auth state
		if (!isLoaded) return;

		// force return to sign-in if no session exists
		if (!isSignedIn) {
			router.push("/sign-in");
			return;
		}

		const processAuth = async () => {
			let role = user?.unsafeMetadata?.role as string | undefined;

			// persist role from signup flow if it hasn't been saved to clerk yet
			if (!role) {
				const roleFromUrl = searchParams.get("role");

				if (roleFromUrl === "mjakazi" || roleFromUrl === "mwaajiri") {
					// prevent multiple concurrent update attempts
					if (isUpdating) return;
					setIsUpdating(true);

					try {
						await user.update({
							unsafeMetadata: { role: roleFromUrl },
						});
						// trigger hard reload to force metadata sync and prevent stale session issues
						window.location.reload();
						return;
					} catch (error) {
						console.error("Error updating user role:", error);
						setIsUpdating(false);
					}
				}
			}

			// route user to the appropriate workspace based on their verified role
			if (role === "mjakazi") {
				router.push("/dashboard/mjakazi");
			} else if (role === "mwaajiri") {
				router.push("/dashboard/mwaajiri");
			} else {
				// fallback for users without a defined role
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
				<div className="border-primary mx-auto mt-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
			</div>
		</div>
	);
};

export { PostAuthPage as default };
