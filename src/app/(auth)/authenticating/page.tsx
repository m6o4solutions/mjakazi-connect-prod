"use client";

import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const Page = () => {
	const router = useRouter();
	const { isLoaded, isSignedIn, user } = useUser();
	const hasRun = useRef(false);

	useEffect(() => {
		if (!isLoaded || !isSignedIn || !user) return;
		// guard against double-invocation in strict mode or fast navigation
		if (hasRun.current) return;
		hasRun.current = true;

		const processRole = async () => {
			const currentRole = user.publicMetadata?.role as string | undefined;

			// role already exists in publicMetadata — no action needed
			if (currentRole) {
				router.replace("/post-auth");
				return;
			}

			// sessionStorage holds the role the user selected before the oauth
			// redirect, since query params are not preserved across the round trip
			const intendedRole = sessionStorage.getItem("intended_role");
			const role = intendedRole === "mwajiri" ? "mwajiri" : "mjakazi";

			try {
				// persist role to publicMetadata via the server-side endpoint
				await fetch("/apis/auth/assign-role", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ role }),
				});

				sessionStorage.removeItem("intended_role");
			} catch {
				// non-fatal — continue to post-auth; the clerk webhook will
				// attempt role resolution when it fires
			}

			router.replace("/post-auth");
		};

		processRole();
	}, [isLoaded, isSignedIn, user, router]);

	return (
		<div className="bg-bg-subtle flex min-h-screen flex-col items-center justify-center gap-5 px-6">
			<div className="text-center">
				<p className="font-display text-foreground text-lg font-bold">Mjakazi Connect</p>
				<div className="bg-accent mx-auto mt-3 h-px w-10" />
			</div>
			<Loader2 className="text-primary h-8 w-8 animate-spin" />
			<div className="text-center">
				<p className="text-foreground text-sm font-medium">Preparing your dashboard</p>
				<p className="text-muted-foreground mt-1 text-xs">
					This will only take a moment.
				</p>
			</div>
		</div>
	);
};

export { Page as default };
