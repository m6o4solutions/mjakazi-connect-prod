"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const Page = () => {
	const params = useSearchParams();
	const roleParam = params.get("role");
	const role = roleParam === "mwajiri" ? "mwajiri" : "mjakazi";

	useEffect(() => {
		// only write to sessionStorage when the role is explicitly present
		// in the url — this prevents the default "mjakazi" from overwriting
		// a previously stored "mwajiri" during clerk's internal redirects
		if (roleParam) {
			sessionStorage.setItem("intended_role", role);
		}
	}, [roleParam, role]);

	return (
		<SignUp
			forceRedirectUrl="/authenticating"
			unsafeMetadata={{ role }}
			appearance={{
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
