import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const allowed = await rateLimitByIp(`paystatus:${token}`, request.headers, 120, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  if (isDemoMode()) {
    const invoice = demoStore.invoices.find((row) => row.pay_token === token);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      status: invoice.status,
      payment: null,
    });
  }

  const admin = createAdminSupabase();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, status, paid_at")
    .eq("pay_token", token)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: payment } = await admin
    .from("payments")
    .select("status, verification, verification_level, utr, paid_at")
    .eq("invoice_id", invoice.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    status: invoice.status,
    paid_at: invoice.paid_at,
    payment: payment || null,
  });
}
