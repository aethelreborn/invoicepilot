import { isDemoMode } from "@/lib/demo";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";

export type EmailSettings = {
  apiKey: string | null;
  fromName: string | null;
  fromEmail: string | null;
  replyTo: string | null;
};

export const EMPTY_EMAIL_SETTINGS: EmailSettings = {
  apiKey: null,
  fromName: null,
  fromEmail: null,
  replyTo: null,
};

export async function loadEmailSettings(userId: string): Promise<EmailSettings> {
  if (isDemoMode()) return EMPTY_EMAIL_SETTINGS;

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("email_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return EMPTY_EMAIL_SETTINGS;

  return {
    apiKey: await decryptSecret(data.resend_api_key_enc),
    fromName: data.from_name,
    fromEmail: data.from_email,
    replyTo: data.reply_to,
  };
}

function addressOf(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

/** "Studio Name <billing@studio.com>", falling back to the platform sender. */
export function senderFor(settings: EmailSettings, businessName: string | null) {
  const name = (settings.fromName || businessName || "InvoicePilot").replace(/[\r\n<>]/g, "").trim();
  const address = addressOf(settings.fromEmail || process.env.RESEND_FROM || "onboarding@resend.dev");
  return `${name || "InvoicePilot"} <${address}>`;
}
