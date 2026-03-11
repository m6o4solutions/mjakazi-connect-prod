import type { User } from "@/payload-types";
import type { Access, AccessArgs } from "payload";

type IsAuthenticated = (args: AccessArgs<User>) => boolean;

// verifies that a user is logged into the system
const isAuthenticated: IsAuthenticated = ({ req: { user } }) => {
	return Boolean(user);
};

// allows full access for logged-in users or restricts to public content for guests
const isAuthenticatedOrPublished: Access = ({ req: { user } }) => {
	if (user) {
		return true;
	}

	return { _status: { equals: "published" } };
};

// grants unrestricted access to everyone
const isPublic: Access = () => true;

// denies access to all users and external requests
const isRestricted: Access = () => false;

// grants full access to admins or restricts users to their own record via clerkId
const isAdminOrOwnProfile: Access = ({ req: { user } }) => {
	if (!user) return false;

	const role = (user as any)?.role;

	if (role === "admin" || role === "sa") {
		return true;
	}

	return {
		"account.clerkId": {
			equals: (user as any)?.clerkId,
		},
	};
};

export {
	isAdminOrOwnProfile,
	isAuthenticated,
	isAuthenticatedOrPublished,
	isPublic,
	isRestricted,
};
