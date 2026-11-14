import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { loadPaymentSettings } from "@/lib/payments/settings";
import { buildUpiUri } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const allowed = await rateLimitByIp(`qr:${token}`, request.headers, 60, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let uri: string | null = null;

  if (isDemoMode()) {
    const invoice = demoStore.invoices.find((row) => row.pay_token === token);
    if (invoice) {
      uri = buildUpiUri({
        vpa: "invoicepilot@upi",
        name: demoStore.profile.business_name || "Demo Studio",
        amountCents: invoice.total_cents,
        currency: invoice.currency,
        note: `Invoice ${invoice.number}`,
      });
    }
  } else {
    const admin = createAdminSupabase();
    const { data: invoice } = await admin
      .from("invoices")
      .select("user_id, number, total_cents, currency, status")
      .eq("pay_token", token)
      .maybeSingle();

    if (invoice && invoice.status !== "paid" && invoice.status !== "void") {
      const settings = await loadPaymentSettings(invoice.user_id);
      if (settings?.upi_vpa) {
        uri = buildUpiUri({
          vpa: settings.upi_vpa,
          name: settings.upi_name,
          amountCents: invoice.total_cents,
          currency: invoice.currency,
          note: `Invoice ${invoice.number}`,
        });
      }
    }
  }

  if (!uri) {
    return NextResponse.json({ error: "No UPI code for this invoice." }, { status: 404 });
  }

  const png = await QRCode.toBuffer(uri, {
    type: "png",
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#16150f", light: "#fbfaf6" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
