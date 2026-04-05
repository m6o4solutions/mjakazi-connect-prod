"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DocumentUploadCardProps {
	documentType: "national_id" | "good_conduct" | "qualification" | "other";
	label: string;
	alreadyUploaded?: boolean;
}

const DocumentUploadCard = ({
	documentType,
	label,
	alreadyUploaded = false,
}: DocumentUploadCardProps) => {
	const router = useRouter();
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// treat server-confirmed uploads and session uploads the same way
	const isUploaded = alreadyUploaded || success;

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
				// refresh the server component so vault query re-runs
				// and all sibling components receive updated props
				router.refresh();
			} else {
				const data = await res.json();
				setError(data.error ?? "Upload failed. Please try again.");
			}
		} catch {
			setError("Network error. Please check your connection.");
		} finally {
			setUploading(false);
		}
	};

	// confirmed upload state — persistent across sessions
	if (isUploaded) {
		return (
			<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
				<div>
					<p className="text-muted-foreground text-sm font-semibold">{label}</p>
					<p className="text-muted-foreground text-sm">
						Upload a clear image or PDF document.
					</p>
				</div>
				<div className="bg-accent/10 flex items-center gap-3 rounded-lg px-4 py-3">
					<CheckCircle2 className="text-accent size-5 shrink-0" />
					<div>
						<p className="text-accent text-sm font-semibold">Document uploaded</p>
						<p className="text-muted-foreground text-xs">
							Your {label.toLowerCase()} has been received.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// upload form state
	return (
		<div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-6">
			<div>
				<p className="text-muted-foreground text-sm font-semibold">{label}</p>
				<p className="text-muted-foreground text-sm">
					Upload a clear image or PDF document.
				</p>
			</div>

			<div className="flex flex-col gap-3">
				<label className="border-border bg-muted/40 hover:bg-muted/70 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-5 text-center transition-colors">
					<UploadCloud className="text-muted-foreground size-6" />
					<span className="text-muted-foreground text-sm">
						{file ? file.name : "Choose a file or drag and drop"}
					</span>
					<span className="text-muted-foreground/60 text-xs">
						JPG, PNG or PDF · Max 5MB
					</span>
					<input
						type="file"
						accept="image/*,application/pdf"
						className="sr-only"
						onChange={(e) => {
							const selected = e.target.files?.[0] ?? null;
							if (selected && selected.size > 5 * 1024 * 1024) {
								setError("File must be under 5MB.");
								return;
							}
							setError(null);
							setFile(selected);
						}}
					/>
				</label>

				<Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
					{uploading ? "Uploading..." : "Upload"}
				</Button>
			</div>

			{error && <p className="text-destructive text-sm">{error}</p>}
		</div>
	);
};

export { DocumentUploadCard };
