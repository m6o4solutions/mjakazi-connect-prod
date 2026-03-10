import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";

const Page = () => {
	return (
		<div>
			<div>Mwajiri Dashboard</div>
			<SignOutButton>
				<Button variant="outline">Sign Out</Button>
			</SignOutButton>
		</div>
	);
};

export { Page as default };
