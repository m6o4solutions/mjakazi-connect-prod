import { Accounts } from "@/payload/collections/accounts/schema";
import { CallsToAction } from "@/payload/collections/calls-to-action/schema";
import { Categories } from "@/payload/collections/categories/schema";
import { Media } from "@/payload/collections/media/schema";
import { Pages } from "@/payload/collections/pages/schema";
import { Posts } from "@/payload/collections/posts/schema";
import { Users } from "@/payload/collections/users/schema";
import { WajakaziProfiles } from "@/payload/collections/wajakazi-profiles/schema";

// central registry for all Payload collections used in the application
const collections = [
	Pages,
	Posts,
	CallsToAction,
	Categories,
	Media,
	Accounts,
	Users,
	WajakaziProfiles,
];

export { collections };
