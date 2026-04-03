"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ImagePlus, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface ProfileFormProps {
	currentDisplayName: string;
	currentPhotoUrl: string | null;
}

const ProfileForm = ({ currentDisplayName, currentPhotoUrl }: ProfileFormProps) => {
	const router = useRouter();
	// hidden file input driven programmatically from the photo preview area and button
	const fileInputRef = useRef<HTMLInputElement>(null);

	// treat the placeholder default name as an empty field so the worker is prompted to fill it
	const [displayName, setDisplayName] = useState(
		currentDisplayName === "New Worker" ? "" : currentDisplayName,
	);
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	// initialise preview from the existing stored photo url
	const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoUrl);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] ?? null;

		if (!file) return;

		// validate before storing to avoid a silent upload failure later
		if (file.size > 5 * 1024 * 1024) {
			setError("Photo must be under 5MB.");
			return;
		}

		if (!file.type.startsWith("image/")) {
			setError("Only image files are accepted.");
			return;
		}

		setError(null);
		setPhotoFile(file);
		// object url gives instant preview without a round-trip to the server
		setPhotoPreview(URL.createObjectURL(file));
	};

	// uploads the photo to payload's media collection and returns the new document id.
	// the id is then sent to the profile update endpoint so it can be linked as a relationship.
	const uploadPhoto = async (): Promise<string | null> => {
		if (!photoFile) return null;

		const formData = new FormData();
		formData.append("file", photoFile);
		formData.append("alt", `Profile photo for ${displayName || "Mjakazi"}`);

		// payload's media rest endpoint handles storage and image processing
		const res = await fetch(`${window.location.origin}/api/media`, {
			method: "POST",
			body: formData,
		});

		if (!res.ok) {
			throw new Error("Photo upload failed. Please try again.");
		}

		const data = await res.json();
		return data.doc?.id ?? null;
	};

	const handleSave = async () => {
		if (!displayName.trim()) {
			setError("Display name is required.");
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			// photo must be uploaded first so we have an id to attach to the profile
			let photoId: string | null = null;
			if (photoFile) {
				photoId = await uploadPhoto();
			}

			const res = await fetch("/apis/profile/update-mjakazi-profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					displayName: displayName.trim(),
					...(photoId ? { photoId } : {}),
				}),
			});

			if (res.ok) {
				setSuccess(true);
				// clear the staged file so a subsequent save doesn't re-upload the same photo
				setPhotoFile(null);
				// refresh server data so the topbar and other server components reflect the new name/photo
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error ?? "Failed to save. Please try again.");
			}
		} catch (err: any) {
			setError(err.message ?? "Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-card border-border flex flex-col gap-6 rounded-xl border p-6">
			<div>
				<p className="text-muted-foreground text-sm font-semibold">Public Profile</p>
				<p className="text-muted-foreground text-sm">
					This is what Waajiri see when browsing the directory.
				</p>
			</div>

			{success && (
				<div className="bg-accent/10 flex items-center gap-3 rounded-lg px-4 py-3">
					<CheckCircle2 className="text-accent h-5 w-5 shrink-0" />
					<p className="text-accent text-sm font-medium">Profile saved successfully.</p>
				</div>
			)}

			{/* photo upload */}
			<div className="flex flex-col gap-3">
				<Label className="text-xs">Profile Photo</Label>
				<div className="flex items-center gap-4">
					{/* photo preview */}
					<div
						onClick={() => fileInputRef.current?.click()}
						className="border-border bg-muted/40 hover:bg-muted relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors"
					>
						{photoPreview ? (
							<img
								src={photoPreview}
								alt="Profile preview"
								className="h-full w-full object-cover"
							/>
						) : (
							<ImagePlus className="text-muted-foreground size-6" />
						)}
					</div>

					<div className="flex flex-col gap-1">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
							className="w-fit text-xs"
						>
							{photoPreview ? "Change Photo" : "Upload Photo"}
						</Button>
						<p className="text-muted-foreground text-xs">
							Passport-sized photo · JPG or PNG · Max 5MB
						</p>
					</div>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					onChange={handlePhotoChange}
					className="sr-only"
				/>
			</div>

			{/* display name */}
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="displayName" className="text-xs">
					Display Name
				</Label>
				<Input
					id="displayName"
					placeholder="Your professional name"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					className="text-sm"
				/>
				<p className="text-muted-foreground text-xs">
					This name appears on your public profile in the directory.
				</p>
			</div>

			<Button onClick={handleSave} disabled={loading} className="w-full gap-2">
				<UserCheck className="h-4 w-4" />
				{loading ? "Saving..." : "Save Profile"}
			</Button>

			{error && <p className="text-destructive text-sm">{error}</p>}
		</div>
	);
};

export { ProfileForm };
