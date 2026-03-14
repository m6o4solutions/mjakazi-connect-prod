"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// provides a transition state during the handoff between Clerk and internal routing logic
const Page = () => {
	const router = useRouter();

	useEffect(() => {
		// delegates dashboard resolution to the post-auth handler to ensure role-based redirection
		router.replace("/post-auth");
	}, [router]);

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
					This will only take a moment...
				</p>
			</div>
		</div>
	);
};

export { Page as default };
