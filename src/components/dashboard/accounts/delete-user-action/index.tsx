"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteUserActionProps {
	clerkId: string;
	role: "mjakazi" | "mwajiri";
	displayName: string;
}

const DeleteUserAction = ({ clerkId, role, displayName }: DeleteUserActionProps) => {
	const router = useRouter();
	// two-step confirmation state to prevent accidental deletion
	const [confirming, setConfirming] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDelete = async () => {
		setLoading(true);
		setError(null);

		try {
			// send both clerkId and role so the API can remove the user
			// from the correct collection and revoke their Clerk account
			const res = await fetch("/apis/admin/delete-user", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ clerkId, role }),
			});

			if (res.ok) {
				// refresh the server component to reflect the removed user
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error ?? "Deletion failed.");
				// return to the initial delete button so the admin can retry
				setConfirming(false);
			}
		} catch {
			setError("Network error.");
			setConfirming(false);
		} finally {
			setLoading(false);
		}
	};

	// confirmation step: shows the user's name and requires an explicit confirm
	if (confirming) {
		return (
			<div className="flex flex-col gap-1.5">
				<p className="text-foreground text-xs">
					Delete <span className="font-semibold">{displayName}</span>?
				</p>
				<div className="flex gap-1.5">
					<Button
						size="sm"
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
						className="h-7 px-2 text-xs"
					>
						{loading ? "Deleting..." : "Confirm"}
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setConfirming(false)}
						disabled={loading}
						className="h-7 px-2 text-xs"
					>
						Cancel
					</Button>
				</div>
				{error && <p className="text-destructive text-xs">{error}</p>}
			</div>
		);
	}

	// initial state: a single button that triggers the confirmation prompt
	return (
		<Button
			size="sm"
			variant="outline"
			onClick={() => setConfirming(true)}
			className="border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive gap-1.5"
		>
			<Trash2 className="size-3.5" />
			Delete
		</Button>
	);
};

export { DeleteUserAction };
