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

// for the accounts collection — matches directly on clerkId
const isAdminOrAccountOwner: Access = ({ req: { user } }) => {
	if (!user) return false;

	const role = (user as any)?.role;

	if (role === "admin" || role === "sa") return true;

	const clerkId = (user as any)?.clerkId;

	return { clerkId: { equals: clerkId } };
};

// for profile collections — matches on the account relationship field (MongoDB ObjectId)
const isAdminOrProfileOwner: Access = ({ req: { user } }) => {
	if (!user) return false;

	const role = (user as any)?.role;

	if (role === "admin" || role === "sa") return true;

	const id = (user as any)?.id;

	return { account: { equals: id } };
};

// for vault collection — matches on the profile relationship field
const isAdminOrVaultOwner: Access = ({ req: { user } }) => {
	if (!user) return false;

	const role = (user as any)?.role;

	if (role === "admin" || role === "sa") return true;

	const id = (user as any)?.id;

	return { uploadedBy: { equals: id } };
};

export {
	isAdminOrAccountOwner,
	isAdminOrProfileOwner,
	isAdminOrVaultOwner,
	isAuthenticated,
	isAuthenticatedOrPublished,
	isPublic,
	isRestricted,
};
