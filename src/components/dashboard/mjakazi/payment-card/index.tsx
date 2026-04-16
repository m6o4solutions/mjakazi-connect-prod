"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, Loader2, PhoneCall, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------

// each value maps to a distinct card view — state drives rendering, not flags
type PaymentState =
	| "idle" // form visible, waiting for input
	| "submitting" // STK push request in flight
	| "waiting" // STK push sent, polling for confirmation
	| "confirmed" // payment confirmed, verification advanced to pending_review
	| "failed" // Safaricom returned a non-zero ResultCode
	| "timeout"; // 2-minute poll window elapsed with no confirmation

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

const REGISTRATION_FEE = 1500;
const POLL_INTERVAL_MS = 5000; // how often to check /apis/me for a status change
const POLL_TIMEOUT_MS = 120000; // mirrors the Inngest timeout — give up after 2 minutes

// ---------------------------------------------------------------------------
// component
// ---------------------------------------------------------------------------

const PaymentCard = () => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [paymentState, setPaymentState] = useState<PaymentState>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// refs rather than state — changing these should not trigger a re-render
	const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// cancel any in-flight timers if the component is removed mid-flow
	useEffect(() => {
		return () => {
			if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
			if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
		};
	}, []);

	// polls /apis/me every 5 seconds looking for verificationStatus === "pending_review"
	// which signals that the callback handler confirmed the payment and advanced the profile
	const startPolling = () => {
		// clear any previous cycle before starting a new one
		if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
		if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

		// hard stop at 2 minutes — matches the server-side expiry window
		pollTimeoutRef.current = setTimeout(() => {
			if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
			setPaymentState("timeout");
		}, POLL_TIMEOUT_MS);

		pollIntervalRef.current = setInterval(async () => {
			try {
				const res = await fetch("/apis/me");

				if (!res.ok) return;

				const data = await res.json();

				if (data.verificationStatus === "pending_review") {
					// callback handler has confirmed the payment — stop polling and celebrate
					if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
					if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
					setPaymentState("confirmed");
				} else if (
					data.verificationStatus === "pending_payment" &&
					paymentState === "waiting"
				) {
					// still waiting — could be that the Inngest timeout already expired
					// the payment record but the profile hasn't moved yet; stay in waiting
					// until the poll timeout fires rather than surfacing a false failure
				}
			} catch {
				// transient network error — continue polling, do not abort the flow
			}
		}, POLL_INTERVAL_MS);
	};

	// sends the STK push request; on success hands off to polling
	const handleSubmit = async () => {
		setErrorMessage(null);
		setPaymentState("submitting");

		try {
			const res = await fetch("/apis/payments/initiate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phoneNumber }),
			});

			const data = await res.json();

			if (!res.ok) {
				// surface the server-side validation or eligibility error directly
				setErrorMessage(data.error ?? "Payment initiation failed. Please try again.");
				setPaymentState("idle");
				return;
			}

			// Safaricom accepted the push — switch to waiting and start the poll cycle
			setPaymentState("waiting");
			startPolling();
		} catch {
			setErrorMessage(
				"A network error occurred. Please check your connection and try again.",
			);
			setPaymentState("idle");
		}
	};

	// clears timers and resets to idle so the Mjakazi can submit a fresh attempt
	const handleRetry = () => {
		if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
		if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
		setPaymentState("idle");
		setErrorMessage(null);
	};

	if (paymentState === "waiting") {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Loader2 className="text-primary size-5 animate-spin" />
						Waiting for Payment
					</CardTitle>
					<CardDescription>
						An M-Pesa prompt has been sent to <strong>{phoneNumber}</strong>.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Open your phone, enter your M-Pesa PIN to complete the payment of{" "}
						<strong>KSh {REGISTRATION_FEE.toLocaleString()}</strong>, and this page will
						update automatically.
					</p>
				</CardContent>
				<CardFooter>
					<Button variant="outline" size="sm" onClick={handleRetry}>
						Use a different number
					</Button>
				</CardFooter>
			</Card>
		);
	}

	if (paymentState === "confirmed") {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CheckCircle2 className="size-5 text-green-500" />
						Payment Confirmed
					</CardTitle>
					<CardDescription>Your registration fee has been received.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Your verification documents are now under review. You will be notified once
						the review is complete.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (paymentState === "timeout") {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="size-5 text-yellow-500" />
						Payment Not Confirmed
					</CardTitle>
					<CardDescription>
						We did not receive a payment confirmation within the expected time.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						This can happen if the M-Pesa prompt was dismissed or timed out. You can try
						again with the same or a different number.
					</p>
				</CardContent>
				<CardFooter>
					<Button onClick={handleRetry}>Try Again</Button>
				</CardFooter>
			</Card>
		);
	}

	if (paymentState === "failed") {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<XCircle className="text-destructive size-5" />
						Payment Failed
					</CardTitle>
					<CardDescription>The M-Pesa transaction was not completed.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						This may be due to an incorrect PIN, insufficient funds, or a cancelled
						request. Please try again.
					</p>
				</CardContent>
				<CardFooter>
					<Button onClick={handleRetry}>Try Again</Button>
				</CardFooter>
			</Card>
		);
	}

	// idle and submitting both render the form — submitting just locks the inputs
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<PhoneCall className="text-primary size-5" />
					Complete Registration Payment
				</CardTitle>
				<CardDescription>
					Pay the one-time registration fee of{" "}
					<strong>KSh {REGISTRATION_FEE.toLocaleString()}</strong> via M-Pesa to submit
					your profile for review.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="mpesa-number">M-Pesa Phone Number</Label>
					<Input
						id="mpesa-number"
						type="tel"
						placeholder="e.g. 0712 345 678"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						disabled={paymentState === "submitting"}
					/>
					<p className="text-muted-foreground text-xs">
						Enter the Safaricom number registered to your M-Pesa account. You will receive
						a payment prompt on this number.
					</p>
				</div>

				{errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
			</CardContent>

			<CardFooter>
				<Button
					onClick={handleSubmit}
					disabled={!phoneNumber.trim() || paymentState === "submitting"}
					className="w-full"
				>
					{paymentState === "submitting" ? (
						<>
							<Loader2 className="mr-2 size-4 animate-spin" />
							Sending M-Pesa Prompt...
						</>
					) : (
						"Pay KSh 1,500 via M-Pesa"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
};

export { PaymentCard };
