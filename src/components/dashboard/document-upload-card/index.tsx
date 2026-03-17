"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DocumentUploadCardProps {
	documentType: "national_id" | "good_conduct" | "qualification" | "other";
	label: string;
}

// enforce a strict upload limit to prevent server-side processing issues
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DocumentUploadCard = ({ documentType, label }: DocumentUploadCardProps) => {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// transmit the selected file to the verification storage endpoint
	const handleUpload = async () => {
		if (!file) return;

		setUploading(true);
		setError(null);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("documentType", documentType);

		try {
			const res = await fetch("/apis/verification/uploads", {
				method: "POST",
				body: formData,
			});

			if (res.ok) {
				setSuccess(true);
			} else {
				const data = await res.json();
				setError(data?.error ?? "Upload failed. Please try again.");
			}
		} catch {
			setError("Network error. Please check your connection.");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
			<div>
				<p className="text-muted-foreground text-sm font-semibold">{label}</p>
				<p className="text-muted-foreground text-sm">
					Upload a clear image or PDF document.
				</p>
			</div>

			<input
				type="file"
				accept="image/*,application/pdf"
				onChange={(e) => {
					const selected = e.target.files?.[0] ?? null;

					// validate file size immediately to provide fast feedback
					if (selected && selected.size > MAX_FILE_SIZE) {
						setError("File must be under 10MB.");
						setFile(null);
						return;
					}

					setError(null);
					setFile(selected);
				}}
				className="text-sm"
			/>

			<Button onClick={handleUpload} disabled={!file || uploading || success}>
				{success ? "Uploaded" : uploading ? "Uploading..." : "Upload"}
			</Button>

			{error && <p className="text-destructive text-sm">{error}</p>}
		</div>
	);
};

export { DocumentUploadCard };
