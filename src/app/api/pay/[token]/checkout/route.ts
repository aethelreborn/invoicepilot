import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { loadPaymentSettings } from "@/lib/payments/settings";
import { createCheckout, buildUpiUri } from "@/lib/payments";
import { ProviderError } from "@/lib/payments/types";
import { planAllows } from "@/lib/plans";
import { appOrigin } from "@/lib/app-url";
import { rateLimitByIp } from "@/lib/rate-limit";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = appOrigin(request);

  const allowed = await rateLimitByIp(`checkout:${token}`, request.headers, 12, 600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  if (isDemoMode()) {
    const invoice = demoStore.invoices.find((row) => row.pay_token === token);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (invoice.status === "paid") {
      return NextResponse.json({
        checkout: { kind: "unavailable", reason: "This invoice is already paid." },
      });
    }

    const uri = buildUpiUri({
      vpa: "invoicepilot@upi",
      name: demoStore.profile.business_name || "Demo Studio",
      amountCents: invoice.total_cents,
      currency: invoice.currency,
      note: `Invoice ${invoice.number}`,
    });

    return NextResponse.json({
      checkout: uri
        ? { kind: "qr", uri }
        : { kind: "unavailable", reason: "Demo payments are configured for INR only." },
    });
  }

  const admin = createAdminSupabase();

  const { data: invoiceRow, error: invoiceError } = await admin
    .from("invoices")
    .select("*")
    .eq("pay_token", token)
    .maybeSingle();

  if (invoiceError) {
    console.error("checkout invoice lookup failed", invoiceError.message);
    return NextResponse.json({ error: "Could not load this invoice." }, { status: 500 });
  }
  if (!invoiceRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = invoiceRow as Invoice;

  if (invoice.status === "paid") {
    return NextResponse.json({
      checkout: { kind: "unavailable", reason: "This invoice is already paid." },
    });
  }
  if (invoice.status === "void" || invoice.status === "draft") {
    return NextResponse.json({ error: "This invoice is not payable." }, { status: 409 });
  }

  const settings = await loadPaymentSettings(invoice.user_id);
  if (!settings) {
    return NextResponse.json({
      checkout: {
        kind: "unavailable",
        reason: "This sender has not set up a payment method yet.",
      },
    });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("business_name, plan")
    .eq("id", invoice.user_id)
    .maybeSingle();

  const needsPaymentRow = ["razorpay", "stripe", "youpi"].includes(settings.provider);
  if (needsPaymentRow && !planAllows(profile?.plan, "hostedCheckout")) {
    return NextResponse.json({
      checkout: {
        kind: "unavailable",
        reason:
          "This payout method needs Starter or Growth. The sender can upgrade on the Billing page, or ask the client to pay by UPI.",
      },
    });
  }

  const paymentId = crypto.randomUUID();

  if (needsPaymentRow) {
    const { error } = await admin.from("payments").insert({
      id: paymentId,
      user_id: invoice.user_id,
      invoice_id: invoice.id,
      provider: settings.provider,
      amount_cents: invoice.total_cents,
      currency: invoice.currency,
      status: "created",
    });

    if (error) {
      console.error("payment row insert failed", error.message);
      return NextResponse.json({ error: "Could not start a payment." }, { status: 500 });
    }
  }

  try {
    const checkout = await createCheckout({
      settings,
      invoice,
      businessName: profile?.business_name || "Invoice sender",
      paymentId,
      origin,
      token,
    });

    if (needsPaymentRow) {
      if (checkout.kind === "redirect") {
        await admin
          .from("payments")
          .update({
            status: "pending",
            checkout_url: checkout.url,
            provider_order_id: checkout.providerOrderId || null,
          })
          .eq("id", paymentId);
      } else if (checkout.kind === "razorpay") {
        await admin
          .from("payments")
          .update({
            status: "pending",
            provider_order_id: checkout.orderId,
          })
          .eq("id", paymentId);
      } else {
        await admin.from("payments").delete().eq("id", paymentId);
      }
    }

    return NextResponse.json({ checkout, payment_id: needsPaymentRow ? paymentId : null });
  } catch (error) {
    if (needsPaymentRow) {
      await admin.from("payments").delete().eq("id", paymentId);
    }

    if (error instanceof ProviderError) {
      console.error("checkout provider error", error.message);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error("checkout failed", (error as Error).message);
    return NextResponse.json({ error: "Could not start a payment." }, { status: 500 });
  }
}
