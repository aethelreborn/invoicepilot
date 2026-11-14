import { ProviderError, type ProviderEvent } from "./types";
import { verifyHmacHex } from "./verify";

type CustomWebhook = {
  event?: string;
  payment_id?: string;
  order_id?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount_cents?: number;
  amount?: string | number;
  currency?: string;
  utr?: string;
};

/**
 * Contract for merchant-run gateways (including self-hosted YouPI variants that
 * post their own payload):
 *
 *   POST /api/webhooks/custom/<user_id>
 *   X-InvoicePilot-Signature: sha256=<hex HMAC-SHA256 of the raw body>
 *   { "invoice_number": "INV-202611-1001", "amount_cents": 120000,
 *     "currency": "INR", "payment_id": "...", "utr": "..." }
 */
export async function parseCustomWebhook(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<ProviderEvent> {
  const expected = signature?.startsWith("sha256=") ? signature.slice(7) : signature;

  if (!expected || !(await verifyHmacHex(secret, rawBody, expected))) {
    throw new ProviderError("Invalid webhook signature.");
  }

  const payload = JSON.parse(rawBody) as CustomWebhook;

  const amountCents =
    typeof payload.amount_cents === "number"
      ? payload.amount_cents
      : Math.round(Number(payload.amount) * 100);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new ProviderError("Webhook payload had no valid amount.");
  }

  if (!payload.invoice_number && !payload.invoice_id && !payload.order_id) {
    throw new ProviderError("Webhook payload must identify the invoice or the payment.");
  }

  return {
    event: payload.event || "payment.paid",
    providerPaymentId: payload.payment_id || null,
    providerOrderId: payload.order_id || payload.payment_id || null,
    invoiceNumber: payload.invoice_number || null,
    amountCents,
    currency: String(payload.currency || "INR").toUpperCase(),
    utr: payload.utr || null,
    verificationLevel: null,
    raw: payload,
  };
}
