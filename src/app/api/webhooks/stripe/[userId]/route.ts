import { NextResponse, type NextRequest } from "next/server";
import { loadPaymentSettings } from "@/lib/payments/settings";
import { parseStripeWebhook } from "@/lib/payments";
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

  const allowed = await rateLimitByIp(`webhook:stripe:${userId}`, request.headers, 600, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const rawBody = await request.text();

  try {
    const settings = await loadPaymentSettings(userId);
    if (!settings?.stripe_webhook_secret) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const event = await parseStripeWebhook(
      rawBody,
      request.headers.get("stripe-signature"),
      settings.stripe_webhook_secret
    );

    if (!event) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const outcome = await settleProviderEvent("stripe", event);
    return NextResponse.json({ ok: true, outcome });
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("stripe webhook failed", (error as Error).message);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
