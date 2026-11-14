import { createAdminSupabase } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import type { PaymentSettings, ProviderId } from "./types";

type PaymentSettingsRow = {
  user_id: string;
  provider: ProviderId;
  upi_vpa: string | null;
  upi_name: string | null;
  bank_details: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret_enc: string | null;
  razorpay_webhook_secret_enc: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key_enc: string | null;
  stripe_webhook_secret_enc: string | null;
  youpi_base_url: string | null;
  youpi_merchant_id: string | null;
  youpi_webhook_secret_enc: string | null;
  custom_webhook_secret_enc: string | null;
};

export async function loadPaymentSettings(userId: string): Promise<PaymentSettings | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("payment_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load payment settings: ${error.message}`);
  }
  if (!data) return null;

  const row = data as PaymentSettingsRow;

  return {
    user_id: row.user_id,
    provider: row.provider,
    upi_vpa: row.upi_vpa,
    upi_name: row.upi_name,
    bank_details: row.bank_details,
    razorpay_key_id: row.razorpay_key_id,
    razorpay_key_secret: await decryptSecret(row.razorpay_key_secret_enc),
    razorpay_webhook_secret: await decryptSecret(row.razorpay_webhook_secret_enc),
    stripe_publishable_key: row.stripe_publishable_key,
    stripe_secret_key: await decryptSecret(row.stripe_secret_key_enc),
    stripe_webhook_secret: await decryptSecret(row.stripe_webhook_secret_enc),
    youpi_base_url: row.youpi_base_url,
    youpi_merchant_id: row.youpi_merchant_id,
    youpi_webhook_secret: await decryptSecret(row.youpi_webhook_secret_enc),
    custom_webhook_secret: await decryptSecret(row.custom_webhook_secret_enc),
  };
}

export function safeSettingsSummary(row: {
  provider: ProviderId;
  upi_vpa: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret_enc: string | null;
  razorpay_webhook_secret_enc: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key_enc: string | null;
  stripe_webhook_secret_enc: string | null;
  youpi_base_url: string | null;
  youpi_merchant_id: string | null;
  youpi_webhook_secret_enc: string | null;
  custom_webhook_secret_enc: string | null;
}) {
  return {
    provider: row.provider,
    upi_vpa: row.upi_vpa,
    razorpay_key_id: row.razorpay_key_id,
    has_razorpay_secret: Boolean(row.razorpay_key_secret_enc),
    has_razorpay_webhook_secret: Boolean(row.razorpay_webhook_secret_enc),
    stripe_publishable_key: row.stripe_publishable_key,
    has_stripe_secret: Boolean(row.stripe_secret_key_enc),
    has_stripe_webhook_secret: Boolean(row.stripe_webhook_secret_enc),
    youpi_base_url: row.youpi_base_url,
    youpi_merchant_id: row.youpi_merchant_id,
    has_youpi_webhook_secret: Boolean(row.youpi_webhook_secret_enc),
    has_custom_webhook_secret: Boolean(row.custom_webhook_secret_enc),
  };
}
