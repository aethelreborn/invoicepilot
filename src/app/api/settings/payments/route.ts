import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const schema = z.object({
  provider: z.enum(["upi", "razorpay", "stripe", "youpi", "custom"]),
  upi_vpa: optionalText(120),
  upi_name: optionalText(120),
  bank_details: optionalText(2000),
  razorpay_key_id: optionalText(120),
  razorpay_key_secret: optionalText(500),
  razorpay_webhook_secret: optionalText(500),
  stripe_publishable_key: optionalText(200),
  stripe_secret_key: optionalText(500),
  stripe_webhook_secret: optionalText(500),
  youpi_base_url: optionalText(300),
  youpi_merchant_id: optionalText(200),
  youpi_webhook_secret: optionalText(500),
  custom_webhook_secret: optionalText(500),
});

const plainFields = [
  "upi_vpa",
  "upi_name",
  "bank_details",
  "razorpay_key_id",
  "stripe_publishable_key",
  "youpi_base_url",
  "youpi_merchant_id",
] as const;

const secretFields = {
  razorpay_key_secret: "razorpay_key_secret_enc",
  razorpay_webhook_secret: "razorpay_webhook_secret_enc",
  stripe_secret_key: "stripe_secret_key_enc",
  stripe_webhook_secret: "stripe_webhook_secret_enc",
  youpi_webhook_secret: "youpi_webhook_secret_enc",
  custom_webhook_secret: "custom_webhook_secret_enc",
} as const;

type SecretField = keyof typeof secretFields;

function summary(settings: Record<string, unknown>) {
  return {
    provider: settings.provider,
    upi_vpa: settings.upi_vpa ?? null,
    upi_name: settings.upi_name ?? null,
    bank_details: settings.bank_details ?? null,
    razorpay_key_id: settings.razorpay_key_id ?? null,
    has_razorpay_secret: Boolean(settings.razorpay_key_secret_enc ?? settings.razorpay_key_secret),
    has_razorpay_webhook_secret: Boolean(
      settings.razorpay_webhook_secret_enc ?? settings.razorpay_webhook_secret
    ),
    stripe_publishable_key: settings.stripe_publishable_key ?? null,
    has_stripe_secret: Boolean(settings.stripe_secret_key_enc ?? settings.stripe_secret_key),
    has_stripe_webhook_secret: Boolean(
      settings.stripe_webhook_secret_enc ?? settings.stripe_webhook_secret
    ),
    youpi_base_url: settings.youpi_base_url ?? null,
    youpi_merchant_id: settings.youpi_merchant_id ?? null,
    has_youpi_webhook_secret: Boolean(
      settings.youpi_webhook_secret_enc ?? settings.youpi_webhook_secret
    ),
    has_custom_webhook_secret: Boolean(
      settings.custom_webhook_secret_enc ?? settings.custom_webhook_secret
    ),
  };
}

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ settings: summary(demoStore.paymentSettings) });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("payment_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ settings: data ? summary(data) : null });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the highlighted fields." }, { status: 400 });
  }

  const data = parsed.data;

  if (data.upi_vpa && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(data.upi_vpa)) {
    return NextResponse.json(
      { error: "Enter a UPI ID in the form name@bank." },
      { status: 400 }
    );
  }

  if (data.razorpay_key_id && !data.razorpay_key_id.startsWith("rzp_")) {
    return NextResponse.json(
      { error: "Razorpay key IDs start with rzp_." },
      { status: 400 }
    );
  }

  if (data.stripe_secret_key && !/^(sk|rk)_/.test(data.stripe_secret_key)) {
    return NextResponse.json(
      { error: "Stripe secret keys start with sk_ or rk_." },
      { status: 400 }
    );
  }

  if (data.youpi_base_url) {
    try {
      const url = new URL(data.youpi_base_url);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !local) {
        return NextResponse.json(
          { error: "The YouPI URL must use HTTPS." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "The YouPI URL is not valid." }, { status: 400 });
    }
  }

  if (data.custom_webhook_secret && data.custom_webhook_secret.length < 24) {
    return NextResponse.json(
      { error: "Use a webhook secret of at least 24 characters." },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    const target = demoStore.paymentSettings;
    target.provider = data.provider;
    for (const field of plainFields) {
      if (data[field] !== undefined) target[field] = data[field] || null;
    }
    for (const field of Object.keys(secretFields) as SecretField[]) {
      if (data[field]) {
        (target as Record<string, unknown>)[field] = data[field];
      }
    }
    return NextResponse.json({ settings: summary(target) });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit("settings:payments", user!.id, 30, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many changes. Try again later." }, { status: 429 });
  }

  const admin = createAdminSupabase();
  const update: Record<string, unknown> = {
    user_id: user!.id,
    provider: data.provider,
  };

  for (const field of plainFields) {
    if (data[field] !== undefined) update[field] = data[field] || null;
  }

  try {
    for (const field of Object.keys(secretFields) as SecretField[]) {
      const value = data[field];
      if (value) update[secretFields[field]] = await encryptSecret(value);
    }
  } catch (error) {
    console.error("secret encryption failed", (error as Error).message);
    return NextResponse.json(
      { error: "Server encryption is not configured. Set SECRETS_KEY." },
      { status: 500 }
    );
  }

  const { error } = await admin
    .from("payment_settings")
    .upsert(update, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_log").insert({
    actor_id: user!.id,
    action: "settings.payments.updated",
    target_type: "payment_settings",
    target_id: user!.id,
    metadata: { provider: data.provider },
  });

  const { data: saved } = await admin
    .from("payment_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return NextResponse.json({ settings: saved ? summary(saved) : null });
}
