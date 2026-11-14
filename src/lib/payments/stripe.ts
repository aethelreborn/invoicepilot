import { ProviderError, type Checkout, type CreateCheckoutArgs, type ProviderEvent } from "./types";
import { verifyHmacHex, withinReplayWindow } from "./verify";

const API = "https://api.stripe.com/v1";

type StripeSession = { id: string; url: string | null };

export async function createStripeCheckout({
  settings,
  invoice,
  paymentId,
  origin,
  token,
}: CreateCheckoutArgs): Promise<Checkout> {
  if (!settings.stripe_secret_key) {
    return { kind: "unavailable", reason: "Stripe is not configured." };
  }

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/pay/${token}?status=success`);
  body.set("cancel_url", `${origin}/pay/${token}?status=cancelled`);
  body.set("client_reference_id", paymentId);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", invoice.currency.toLowerCase());
  body.set("line_items[0][price_data][unit_amount]", String(invoice.total_cents));
  body.set("line_items[0][price_data][product_data][name]", `Invoice ${invoice.number}`);
  body.set("metadata[payment_id]", paymentId);
  body.set("metadata[invoice_id]", invoice.id);

  const response = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${settings.stripe_secret_key}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new ProviderError(`Stripe checkout creation failed (${response.status}).`);
  }

  const session = (await response.json()) as StripeSession;
  if (!session.url) {
    throw new ProviderError("Stripe did not return a checkout URL.");
  }

  return { kind: "redirect", url: session.url, providerOrderId: session.id };
}

type StripeWebhook = {
  type?: string;
  data?: { object?: Record<string, unknown> };
};

function parseSignatureHeader(header: string) {
  const timestamp = header
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("t="))
    ?.slice(2);

  const signatures = header
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  return { timestamp: timestamp ? Number(timestamp) : NaN, signatures };
}

export async function parseStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<ProviderEvent | null> {
  if (!signatureHeader) {
    throw new ProviderError("Missing Stripe signature.");
  }

  const { timestamp, signatures } = parseSignatureHeader(signatureHeader);

  if (!withinReplayWindow(timestamp)) {
    throw new ProviderError("Stripe signature timestamp is outside the replay window.");
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  let valid = false;

  for (const signature of signatures) {
    if (await verifyHmacHex(secret, signedPayload, signature)) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    throw new ProviderError("Invalid Stripe signature.");
  }

  const payload = JSON.parse(rawBody) as StripeWebhook;
  const event = payload.type || "";

  if (event !== "checkout.session.completed") {
    return null;
  }

  const session = payload.data?.object;
  if (!session) {
    throw new ProviderError("Stripe payload had no session.");
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const amount = Number(session.amount_total);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ProviderError("Stripe payload had no valid amount.");
  }

  const metadata = (session.metadata || {}) as Record<string, unknown>;

  return {
    event,
    providerPaymentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    providerOrderId: typeof session.id === "string" ? session.id : null,
    invoiceNumber: null,
    amountCents: amount,
    currency: String(session.currency || "").toUpperCase(),
    utr: null,
    verificationLevel: null,
    raw: { ...payload, _invoice_id: metadata.invoice_id ?? null },
  };
}
