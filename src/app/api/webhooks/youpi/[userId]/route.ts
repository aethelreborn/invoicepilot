import { NextResponse, type NextRequest } from "next/server";
import { loadPaymentSettings } from "@/lib/payments/settings";
import { parseYoupiWebhook, fetchYoupiVerificationLevel } from "@/lib/payments";
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

  const allowed = await rateLimitByIp(`webhook:youpi:${userId}`, request.headers, 600, 60);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const rawBody = await request.text();

  try {
    const settings = await loadPaymentSettings(userId);
    if (!settings?.youpi_webhook_secret || !settings.youpi_base_url) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const event = await parseYoupiWebhook(rawBody, request.headers, settings.youpi_webhook_secret);

    if (!event) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (event.providerPaymentId) {
      event.verificationLevel = await fetchYoupiVerificationLevel(
        settings.youpi_base_url,
        event.providerPaymentId
      );
    }

    const outcome = await settleProviderEvent("youpi", event);
    return NextResponse.json({ ok: true, outcome });
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("youpi webhook failed", (error as Error).message);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
