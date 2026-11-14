import { buildUpiUri } from "./upi";
import { createRazorpayCheckout } from "./razorpay";
import { createStripeCheckout } from "./stripe";
import { createYoupiCheckout } from "./youpi";
import type { Checkout, CreateCheckoutArgs } from "./types";

export async function createCheckout(args: CreateCheckoutArgs): Promise<Checkout> {
  switch (args.settings.provider) {
    case "upi": {
      if (!args.settings.upi_vpa) {
        return {
          kind: "unavailable",
          reason: "This sender has not added a UPI ID to their payment settings.",
        };
      }

      const uri = buildUpiUri({
        vpa: args.settings.upi_vpa,
        name: args.settings.upi_name || args.businessName,
        amountCents: args.invoice.total_cents,
        currency: args.invoice.currency,
        note: `Invoice ${args.invoice.number}`,
      });

      if (!uri) {
        return {
          kind: "unavailable",
          reason: "A UPI QR can only be used for invoices in Indian rupees.",
        };
      }

      return { kind: "qr", uri };
    }

    case "razorpay":
      return createRazorpayCheckout(args);

    case "stripe":
      return createStripeCheckout(args);

    case "youpi":
      return createYoupiCheckout(args);

    case "custom":
      return { kind: "manual" };

    default:
      return { kind: "unavailable", reason: "No payment method is configured." };
  }
}

export { parseRazorpayWebhook } from "./razorpay";
export { parseStripeWebhook } from "./stripe";
export { parseYoupiWebhook, fetchYoupiVerificationLevel } from "./youpi";
export { parseCustomWebhook } from "./custom";
export { buildUpiUri } from "./upi";
