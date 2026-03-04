"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const Page = () => {
	const params = useSearchParams();
	const role = params.get("role");

	const redirectUrl = role ? `/post-auth?role=${role}` : "/post-auth";

	return <SignUp forceRedirectUrl={redirectUrl} />;
};

export { Page as default };
