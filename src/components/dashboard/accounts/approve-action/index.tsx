"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ApproveActionProps {
	profileId: string;
}

const ApproveAction = ({ profileId }: ApproveActionProps) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	// tracks whether approval has already succeeded to swap in a confirmation state
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleApprove = async () => {
		setLoading(true);
		setError(null);

		try {
			// hits the verification approval endpoint with the target profile id
			const res = await fetch("/apis/verification/approve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ profileId }),
			});

			if (res.ok) {
				// mark as done and revalidate the current route so the table reflects the change
				setDone(true);
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error ?? "Approval failed.");
			}
		} catch {
			setError("Network error.");
		} finally {
			setLoading(false);
		}
	};

	// once approved, replace the button with a lightweight confirmation indicator
	if (done) {
		return (
			<div className="flex items-center gap-1.5">
				<CheckCircle2 className="text-accent size-4" />
				<span className="text-accent text-xs font-medium">Approved</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<Button
				size="sm"
				onClick={handleApprove}
				disabled={loading}
				className="bg-accent text-accent-foreground hover:bg-accent-hover gap-1.5"
			>
				<CheckCircle2 className="size-3.5" />
				{loading ? "Approving..." : "Approve"}
			</Button>
			{/* surface any server-side or network error inline beneath the button */}
			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
};

export { ApproveAction };
