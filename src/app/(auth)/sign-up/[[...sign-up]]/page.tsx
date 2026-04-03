"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
	const params = useSearchParams();
	const roleParam = params.get("role");

	// only allow "mwajiri" if explicitly passed — all other cases default to "mjakazi"
	// mwajiri (employer) sign-ups are typically initiated from a dedicated flow that appends ?role=mwajiri
	const role = roleParam === "mwajiri" ? "mwajiri" : "mjakazi";

	return (
		// role is stored in unsafeMetadata so the authenticating route can assign
		// the correct permissions and profile type after Clerk verifies the user
		<SignUp
			forceRedirectUrl="/authenticating"
			unsafeMetadata={{ role }}
			appearance={{
				// override Clerk's default styles to match the app's design system
				elements: {
					rootBox: "w-full",
					card: "shadow-none border-none bg-transparent p-0",
					headerTitle: "font-display text-xl font-bold text-foreground",
					headerSubtitle: "text-muted-foreground text-sm",
					socialButtonsBlockButton:
						"border-border bg-background text-foreground hover:bg-muted text-sm font-medium",
					formFieldLabel: "text-xs font-medium text-muted-foreground",
					formFieldInput:
						"border-border bg-background text-foreground text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary",
					formButtonPrimary:
						"bg-primary hover:bg-brand-primary-light text-primary-foreground text-sm font-semibold rounded-lg",
					footerActionText: "text-muted-foreground text-xs",
					footerActionLink: "text-primary font-medium text-xs",
					dividerLine: "bg-border",
					dividerText: "text-muted-foreground text-xs",
				},
			}}
		/>
	);
};

export { Page as default };
