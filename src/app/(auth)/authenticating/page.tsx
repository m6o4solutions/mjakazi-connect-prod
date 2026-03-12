"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// provides a transitionary loading state during the authentication handshake
const Page = () => {
	const router = useRouter();

	useEffect(() => {
		// immediately redirects to the post-auth route once the component mounts
		router.replace("/post-auth");
	}, [router]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4">
			<div className="border-primary size-8 animate-spin rounded-full border-b-2" />
			<p className="text-muted-foreground text-sm">Please wait while we sign you in...</p>
		</div>
	);
};

export { Page as default };
