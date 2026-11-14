import type { Invoice } from "@/lib/types";

export type ProviderId = "upi" | "razorpay" | "stripe" | "youpi" | "custom";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  upi: "UPI QR (manual confirmation)",
  razorpay: "Razorpay",
  stripe: "Stripe",
  youpi: "YouPI gateway",
  custom: "Custom signed webhook",
};

export const PROVIDER_DESCRIPTIONS: Record<ProviderId, string> = {
  upi: "Clients scan a UPI QR built from your VPA, then claim the payment. You confirm it.",
  razorpay: "Clients pay through Razorpay Checkout. A signed webhook closes the invoice automatically.",
  stripe: "Clients pay through Stripe Checkout. A signed webhook closes the invoice automatically.",
  youpi: "Clients pay through your own YouPI instance. Its signed webhook closes the invoice.",
  custom: "Your own system posts a signed JSON webhook when the money arrives.",
};

export type PaymentSettings = {
  user_id: string;
  provider: ProviderId;
  upi_vpa: string | null;
  upi_name: string | null;
  bank_details: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
  razorpay_webhook_secret: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  youpi_base_url: string | null;
  youpi_merchant_id: string | null;
  youpi_webhook_secret: string | null;
  custom_webhook_secret: string | null;
};

export type Checkout =
  | { kind: "qr"; uri: string }
  | { kind: "redirect"; url: string; providerOrderId?: string }
  | {
      kind: "razorpay";
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      businessName: string;
      description: string;
      prefillEmail?: string;
    }
  | { kind: "manual"; note?: string }
  | { kind: "unavailable"; reason: string };

export type ProviderEvent = {
  event: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  invoiceNumber: string | null;
  amountCents: number;
  currency: string;
  utr: string | null;
  verificationLevel: number | null;
  raw: unknown;
};

export type CreateCheckoutArgs = {
  settings: PaymentSettings;
  invoice: Invoice;
  businessName: string;
  paymentId: string;
  origin: string;
  token: string;
};

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export function providerIsConfigured(settings: PaymentSettings): boolean {
  switch (settings.provider) {
    case "upi":
      return Boolean(settings.upi_vpa);
    case "razorpay":
      return Boolean(settings.razorpay_key_id && settings.razorpay_key_secret);
    case "stripe":
      return Boolean(settings.stripe_secret_key);
    case "youpi":
      return Boolean(settings.youpi_base_url && settings.youpi_merchant_id);
    case "custom":
      return Boolean(settings.custom_webhook_secret);
    default:
      return false;
  }
}
