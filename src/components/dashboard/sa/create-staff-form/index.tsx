"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, UserPlus } from "lucide-react";
import { useState } from "react";

const CreateStaffForm = () => {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		// first name and email are the minimum required to provision a clerk account
		if (!firstName.trim() || !email.trim()) {
			setError("First name and email are required.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// delegate account creation to the server-side api route which
			// handles clerk provisioning and payload record creation
			const res = await fetch("/apis/admin/create-staff", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					email: email.trim(),
				}),
			});

			if (res.ok) {
				// reset form on success so the sa can immediately add another account
				setSuccess(true);
				setFirstName("");
				setLastName("");
				setEmail("");
			} else {
				const data = await res.json();
				setError(data.error ?? "Failed to create staff account.");
			}
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
			<div>
				<p className="text-muted-foreground text-sm font-semibold">
					Create Staff Account
				</p>
				<p className="text-muted-foreground text-sm">
					New staff must reset their password during their initial sign-in.
				</p>
			</div>

			{success && (
				<div className="bg-accent/10 flex items-center gap-3 rounded-lg px-4 py-3">
					<CheckCircle2 className="text-accent size-5 shrink-0" />
					<p className="text-accent text-sm font-medium">
						Staff account created successfully.
					</p>
				</div>
			)}

			<div className="grid gap-3 sm:grid-cols-2">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="firstName" className="text-xs">
						First Name
					</Label>
					<Input
						id="firstName"
						placeholder="Jane"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						className="text-sm"
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="lastName" className="text-xs">
						Last Name
					</Label>
					<Input
						id="lastName"
						placeholder="Doe"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						className="text-sm"
					/>
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<Label htmlFor="email" className="text-xs">
					Email Address
				</Label>
				<Input
					id="email"
					type="email"
					placeholder="staff@mjakaziconnect.co.ke"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="text-sm"
				/>
			</div>

			<Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
				<UserPlus className="size-4" />
				{loading ? "Creating..." : "Create Staff Account"}
			</Button>

			{error && <p className="text-destructive text-sm">{error}</p>}
		</div>
	);
};

export { CreateStaffForm };
