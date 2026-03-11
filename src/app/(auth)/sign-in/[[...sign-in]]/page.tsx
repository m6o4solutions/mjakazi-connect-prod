import { SignIn } from "@clerk/nextjs";

// renders the clerk sign-in component with a fixed redirect to the post-auth handler
const Page = () => {
	return <SignIn forceRedirectUrl="/post-auth" />;
};

export { Page as default };
