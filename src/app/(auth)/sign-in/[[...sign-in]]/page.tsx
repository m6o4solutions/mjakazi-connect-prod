import { SignIn } from "@clerk/nextjs";

const Page = () => {
	return <SignIn forceRedirectUrl="/post-auth" />;
};

export { Page as default };
