import PostAuthClient from "@/app/(saas)/post-auth/post-auth-client";
import { Suspense } from "react";

export default function PostAuthPage() {
	return (
		// wrap in suspense to handle useSearchParams in the client component
		<Suspense fallback={null}>
			<PostAuthClient />
		</Suspense>
	);
}
