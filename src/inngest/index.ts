import { paymentTimeout } from "@/inngest/functions/payment-timeout";
import { verificationExpiry } from "@/inngest/functions/verification-expiry";

// all inngest functions registered here
export const functions = [verificationExpiry, paymentTimeout];
