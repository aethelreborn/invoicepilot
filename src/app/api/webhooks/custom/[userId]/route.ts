import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { loadPaymentSettings } from "@/lib/payments/settings";
import { parseCustomWebhook } from "@/lib/payments";
import { settleProviderEvent } from "@/lib/payments/settle";
import { ProviderError } from "@/lib/payments/types";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  if (!UUID.test(userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await rateLimitByIp(`webhook:custom:${userId}`, request.headers, 300, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const rawBody = await request.text();

  try {
    const settings = await loadPaymentSettings(userId);
    if (!settings?.custom_webhook_secret) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const event = await parseCustomWebhook(
      rawBody,
      request.headers.get("x-invoicepilot-signature"),
      settings.custom_webhook_secret
    );

    const admin = createAdminSupabase();
    const raw = (event.raw || {}) as Record<string, unknown>;

    let invoice: { id: string; total_cents: number; currency: string } | null = null;

    if (event.invoiceNumber) {
      const { data } = await admin
        .from("invoices")
        .select("id, total_cents, currency")
        .eq("user_id", userId)
        .eq("number", event.invoiceNumber)
        .maybeSingle();
      invoice = data;
    }

    if (!invoice && typeof raw.invoice_id === "string") {
      const { data } = await admin
        .from("invoices")
        .select("id, total_cents, currency")
        .eq("user_id", userId)
        .eq("id", raw.invoice_id)
        .maybeSingle();
      invoice = data;
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (
      event.amountCents !== invoice.total_cents ||
      event.currency !== invoice.currency.toUpperCase()
    ) {
      await admin.from("audit_log").insert({
        action: "payment.amount_mismatch",
        target_type: "invoice",
        target_id: invoice.id,
        metadata: {
          provider: "custom",
          expected_cents: invoice.total_cents,
          received_cents: event.amountCents,
          expected_currency: invoice.currency,
          received_currency: event.currency,
        },
      });

      return NextResponse.json(
        { error: "Amount does not match the invoice." },
        { status: 422 }
      );
    }

    let orderId = event.providerOrderId;

    if (!orderId) {
      const { data: existing } = await admin
        .from("payments")
        .select("provider_order_id")
        .eq("invoice_id", invoice.id)
        .eq("provider", "custom")
        .not("provider_order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      orderId = existing?.provider_order_id ?? null;
    }

    if (!orderId) {
      orderId = `custom_${crypto.randomUUID()}`;
      const { error } = await admin.from("payments").insert({
        user_id: userId,
        invoice_id: invoice.id,
        provider: "custom",
        provider_order_id: orderId,
        amount_cents: invoice.total_cents,
        currency: invoice.currency,
        status: "pending",
      });

      if (error) {
        console.error("custom webhook payment insert failed", error.message);
        return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
      }
    }

    event.providerOrderId = orderId;

    const outcome = await settleProviderEvent("custom", event);
    return NextResponse.json({ ok: true, outcome });
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("custom webhook failed", (error as Error).message);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
