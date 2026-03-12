"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// provides a transitionary loading state while the system prepares the user's workspace
const Page = () => {
	const router = useRouter();

	useEffect(() => {
		// immediately redirects to the post-auth route to trigger role-based dashboard resolution
		router.replace("/post-auth");
	}, [router]);

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

export { Page as default };
