import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { rateLimitByIp } from "@/lib/rate-limit";
import { claimOtpGate, sendClaimOtp, verifyClaimOtp } from "@/lib/claim-otp";
import type { Invoice } from "@/lib/types";

type PublicLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

type PublicInvoicePayload = {
  invoice: Invoice;
  line_items: PublicLineItem[];
  business_name: string | null;
  business_email: string | null;
  payment: {
    provider: "upi" | "razorpay" | "stripe" | "youpi" | "custom";
    upi_vpa: string | null;
    upi_name: string | null;
    bank_details: string | null;
    has_checkout: boolean;
  } | null;
};

const PROVIDERS = new Set(["upi", "razorpay", "stripe", "youpi", "custom"]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (isDemoMode()) {
    const invoice = demoStore.invoices.find((i) => i.pay_token === token);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!invoice.viewed_at && invoice.status === "sent") {
      invoice.viewed_at = new Date().toISOString();
      invoice.status = "viewed";
    }
    return NextResponse.json({ invoice });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("get_public_invoice", { p_token: token });
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payload = data as PublicInvoicePayload;
  if (payload.invoice.status === "sent" && !payload.invoice.viewed_at) {
    await supabase.rpc("mark_public_invoice_viewed", { p_token: token });
    payload.invoice.status = "viewed";
  }

  return NextResponse.json({
    invoice: { ...payload.invoice, invoice_line_items: payload.line_items },
    business_name: payload.business_name,
    business_email: payload.business_email,
    payment: payload.payment,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const allowed = await rateLimitByIp(`claim:${token}`, request.headers, 8, 600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action === "request-otp" ? "request-otp" : "claim";
  const provider = typeof body.provider === "string" && PROVIDERS.has(body.provider)
    ? body.provider
    : "upi";
  const note = typeof body.note === "string" ? body.note.slice(0, 280) : null;

  if (isDemoMode()) {
    if (action === "request-otp") {
      return NextResponse.json({ otp_required: false });
    }
    const invoice = demoStore.invoices.find((i) => i.pay_token === token);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (invoice.status === "claimed" || invoice.status === "paid") {
      return NextResponse.json({ ok: true, status: invoice.status });
    }
    if (!["sent", "viewed", "overdue"].includes(invoice.status)) {
      return NextResponse.json({ error: "This invoice cannot be claimed." }, { status: 409 });
    }
    invoice.status = "claimed";
    invoice.viewed_at = invoice.viewed_at || new Date().toISOString();
    invoice.updated_at = new Date().toISOString();
    return NextResponse.json({ ok: true, status: "claimed" });
  }

  const admin = createAdminSupabase();
  const { data: invoiceRow, error: invoiceError } = await admin
    .from("invoices")
    .select("*")
    .eq("pay_token", token)
    .maybeSingle();

  if (invoiceError) {
    console.error("claim invoice lookup failed", invoiceError.message);
    return NextResponse.json({ error: "Could not load this invoice." }, { status: 500 });
  }
  if (!invoiceRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const invoice = invoiceRow as Invoice;

  if (action === "request-otp") {
    const gate = await claimOtpGate(invoice);
    if (gate === "direct") {
      return NextResponse.json({ otp_required: false });
    }
    const result = await sendClaimOtp(invoice);
    if (!result.ok) {
      console.error("claim otp send failed", result.reason);
      return NextResponse.json(
        { error: "Could not send the code. Try again in a moment." },
        { status: 502 }
      );
    }
    return NextResponse.json({ otp_required: true });
  }

  const gate = await claimOtpGate(invoice);
  if (gate === "otp") {
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Enter the 6-digit code from the email." },
        { status: 400 }
      );
    }
    const verified = await verifyClaimOtp(invoice, otp);
    if (!verified) {
      return NextResponse.json(
        { error: "That code did not match, or it has expired. Request a fresh one." },
        { status: 400 }
      );
    }
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("claim_public_invoice", {
    p_token: token,
    p_provider: provider,
    p_note: note,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (data === "closed") {
    return NextResponse.json({ error: "This invoice cannot be claimed." }, { status: 409 });
  }
  if (data === "already") {
    return NextResponse.json({ ok: true, status: "claimed" });
  }

  return NextResponse.json({ ok: true, status: data });
}
