import { ProviderError, type Checkout, type CreateCheckoutArgs, type ProviderEvent } from "./types";
import { verifyHmacHex } from "./verify";

const API = "https://api.razorpay.com/v1";

type RazorpayOrder = { id: string; amount: number; currency: string };

export async function createRazorpayCheckout({
  settings,
  invoice,
  businessName,
  paymentId,
}: CreateCheckoutArgs): Promise<Checkout> {
  if (!settings.razorpay_key_id || !settings.razorpay_key_secret) {
    return { kind: "unavailable", reason: "Razorpay keys are not configured." };
  }

  if (invoice.currency.toUpperCase() !== "INR") {
    return { kind: "unavailable", reason: "Razorpay is enabled for INR invoices only." };
  }

  const authorization = `Basic ${btoa(`${settings.razorpay_key_id}:${settings.razorpay_key_secret}`)}`;

  const response = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization,
    },
    body: JSON.stringify({
      amount: invoice.total_cents,
      currency: "INR",
      receipt: paymentId,
      notes: {
        invoice_id: invoice.id,
        invoice_number: invoice.number,
      },
    }),
  });

  if (!response.ok) {
    throw new ProviderError(`Razorpay order creation failed (${response.status}).`);
  }

  const order = (await response.json()) as RazorpayOrder;

  return {
    kind: "razorpay",
    keyId: settings.razorpay_key_id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    businessName,
    description: `Invoice ${invoice.number}`,
    prefillEmail: invoice.client_email || undefined,
  };
}

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: Record<string, unknown> };
    order?: { entity?: Record<string, unknown> };
  };
};

export async function parseRazorpayWebhook(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<ProviderEvent | null> {
  if (!signature || !(await verifyHmacHex(secret, rawBody, signature))) {
    throw new ProviderError("Invalid Razorpay signature.");
  }

  const payload = JSON.parse(rawBody) as RazorpayWebhook;
  const event = payload.event || "";

  if (event !== "payment.captured" && event !== "order.paid") {
    return null;
  }

  const payment = payload.payload?.payment?.entity;
  const order = payload.payload?.order?.entity;
  const entity = payment || order;

  if (!entity) {
    throw new ProviderError("Razorpay payload had no payment entity.");
  }

  const amount = Number(entity.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ProviderError("Razorpay payload had no valid amount.");
  }

  const acquirer = payment?.acquirer_data as Record<string, unknown> | undefined;

  return {
    event,
    providerPaymentId: typeof payment?.id === "string" ? payment.id : null,
    providerOrderId:
      typeof payment?.order_id === "string"
        ? payment.order_id
        : typeof order?.id === "string"
          ? order.id
          : null,
    invoiceNumber: null,
    amountCents: amount,
    currency: String(entity.currency || "INR").toUpperCase(),
    utr: typeof acquirer?.upi_transaction_id === "string" ? acquirer.upi_transaction_id : null,
    verificationLevel: null,
    raw: payload,
  };
}
