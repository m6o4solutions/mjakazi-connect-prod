"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

// custom sign-up page that captures and passes role-based metadata to Clerk
const Page = () => {
	const params = useSearchParams();
	const role = params.get("role");

	// attaches the selected role to the user's metadata for backend synchronization
	const unsafeMetadata = role ? { role } : undefined;

	return <SignUp forceRedirectUrl="/post-auth" unsafeMetadata={unsafeMetadata} />;
};

export { Page as default };
