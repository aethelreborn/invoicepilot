import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { buildUpiUri } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const allowed = await rateLimitByIp("billing:qr", request.headers, 30, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const pa = request.nextUrl.searchParams.get("pa");
  const am = request.nextUrl.searchParams.get("am");
  const pn = request.nextUrl.searchParams.get("pn");
  const tn = request.nextUrl.searchParams.get("tn") || "Invoice payment";

  if (!pa || !am) {
    return NextResponse.json({ error: "Missing pa or am." }, { status: 400 });
  }

  const amountCents = Math.round(Number(am) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const uri = buildUpiUri({
    vpa: pa,
    name: pn,
    amountCents,
    currency: "INR",
    note: tn.slice(0, 50),
  });

  if (!uri) {
    return NextResponse.json({ error: "UPI is INR only." }, { status: 400 });
  }

  const png = await QRCode.toBuffer(uri, {
    type: "png",
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#16150f", light: "#fbfaf6" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=60, s-maxage=60" },
  });
}
