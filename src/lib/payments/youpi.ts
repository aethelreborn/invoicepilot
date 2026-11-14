import { minorUnitsToDecimalString } from "@/lib/currency";
import { ProviderError, type Checkout, type CreateCheckoutArgs, type ProviderEvent } from "./types";
import { verifyHmacHex, withinReplayWindow } from "./verify";

type YoupiSession = {
  paymentId?: string;
  checkoutUrl?: string;
};

function baseUrl(raw: string) {
  const url = new URL(raw);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !local) {
    throw new ProviderError("YouPI base URL must use HTTPS.");
  }
  return url.origin;
}

export async function createYoupiCheckout({
  settings,
  invoice,
  paymentId,
  origin,
  token,
}: CreateCheckoutArgs): Promise<Checkout> {
  if (!settings.youpi_base_url || !settings.youpi_merchant_id) {
    return { kind: "unavailable", reason: "YouPI is not configured." };
  }

  if (invoice.currency.toUpperCase() !== "INR") {
    return { kind: "unavailable", reason: "YouPI is enabled for INR invoices only." };
  }

  const response = await fetch(`${baseUrl(settings.youpi_base_url)}/api/v1/payments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-merchant-id": settings.youpi_merchant_id,
      "idempotency-key": paymentId,
    },
    body: JSON.stringify({
      orderId: paymentId,
      amount: minorUnitsToDecimalString(invoice.total_cents),
      currency: "INR",
      customer: {
        name: invoice.client_name,
        email: invoice.client_email || undefined,
      },
      description: `Invoice ${invoice.number}`,
      returnUrl: `${origin}/pay/${token}?status=success`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
      },
    }),
  });

  const raw = await response.text().catch(() => "");
  let session: YoupiSession = {};
  try {
    session = JSON.parse(raw) as YoupiSession;
  } catch {
    session = {};
  }

  if (!response.ok || !session.checkoutUrl || !session.paymentId) {
    const excerpt = raw.replace(/\s+/g, " ").trim().slice(0, 240);
    throw new ProviderError(
      `YouPI session creation failed (${response.status})${excerpt ? `: ${excerpt}` : ". Returned no checkout URL."}`
    );
  }

  // The gateway echoes our order id back in its webhook, so that is the value
  // stored on the payment row and matched during settlement.
  return {
    kind: "redirect",
    url: session.checkoutUrl,
    providerOrderId: paymentId,
  };
}

type YoupiWebhook = {
  event?: string;
  paymentId?: string;
  orderId?: string;
  amount?: string | number;
  amountPaise?: number;
  currency?: string;
  utr?: string;
  metadata?: Record<string, unknown>;
};

export async function parseYoupiWebhook(
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<ProviderEvent | null> {
  const header = headers.get("x-gateway-signature");
  if (!header?.startsWith("sha256=")) {
    throw new ProviderError("Missing YouPI signature.");
  }

  if (!(await verifyHmacHex(secret, rawBody, header.slice(7)))) {
    throw new ProviderError("Invalid YouPI signature.");
  }

  const timestampHeader = headers.get("x-gateway-timestamp");
  if (timestampHeader && /^\d+$/.test(timestampHeader)) {
    const raw = Number(timestampHeader);
    const seconds = raw > 1_000_000_000_000 ? raw / 1000 : raw;
    if (!withinReplayWindow(seconds)) {
      throw new ProviderError("YouPI signature timestamp is outside the replay window.");
    }
  }

  const payload = JSON.parse(rawBody) as YoupiWebhook;
  const event = payload.event || "";

  if (event !== "SUCCESS") {
    return null;
  }

  const amountCents =
    typeof payload.amountPaise === "number"
      ? payload.amountPaise
      : Math.round(Number(payload.amount) * 100);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new ProviderError("YouPI payload had no valid amount.");
  }

  const metadata = payload.metadata || {};

  return {
    event,
    providerPaymentId: payload.paymentId || null,
    providerOrderId: payload.orderId || payload.paymentId || null,
    invoiceNumber:
      typeof metadata.invoice_number === "string" ? metadata.invoice_number : null,
    amountCents,
    currency: String(payload.currency || "INR").toUpperCase(),
    utr: payload.utr || null,
    verificationLevel: null,
    raw: payload,
  };
}

/** Best-effort read of the gateway's verification level for the audit trail. */
export async function fetchYoupiVerificationLevel(base: string, paymentId: string) {
  try {
    const response = await fetch(`${baseUrl(base)}/api/v1/payments/${paymentId}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as { verificationLevel?: unknown };
    return typeof payload.verificationLevel === "number" ? payload.verificationLevel : null;
  } catch {
    return null;
  }
}
