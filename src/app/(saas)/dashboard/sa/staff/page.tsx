import { CreateStaffForm } from "@/components/dashboard/sa/create-staff-form";
import { StaffTable } from "@/components/dashboard/sa/staff-table";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { resolveIdentity } from "@/services/identity.service";
import { auth } from "@clerk/nextjs/server";
import config from "@payload-config";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

const Page = async () => {
	// gate this page to authenticated sa users only
	const { userId } = await auth();

	if (!userId) redirect("/sign-in");

	const payload = await getPayload({ config });
	const identity = await resolveIdentity(payload, userId);

	if (!identity) redirect("/sign-in");
	if (identity.role !== "sa") redirect("/sign-in");

	// load all admin and sa accounts to display in the staff table
	// sorted by newest first with a reasonable upper limit
	const staffAccounts = await payload.find({
		collection: "accounts",
		where: { role: { in: ["admin", "sa"] } },
		overrideAccess: true,
		sort: "-createdAt",
		limit: 100,
	});

	// normalise to a plain shape so the client component stays free of payload types
	const staff = staffAccounts.docs.map((account: any) => ({
		id: account.id,
		clerkId: account.clerkId,
		firstName: account.firstName ?? "",
		lastName: account.lastName ?? "",
		email: account.email,
		role: account.role,
		createdAt: account.createdAt,
	}));

	return (
		<>
			<DashboardTopbar title="Staff Management" />
			<main className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-6 md:grid-cols-2">
					<CreateStaffForm />
				</div>
				{/* pass current user id so the table can prevent self-removal */}
				<StaffTable staff={staff} currentUserClerkId={userId} />
			</main>
		</>
	);
};

export { Page as default };
