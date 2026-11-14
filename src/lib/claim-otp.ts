import { createAdminSupabase } from "@/lib/supabase/admin";
import { loadEmailSettings, senderFor } from "@/lib/email/settings";
import { sendEmail } from "@/lib/email/resend";
import { generateOtpCode, hashOtp, otpExpired, otpExpiresAt } from "@/lib/otp";
import { formatMoney } from "@/lib/currency";
import type { Invoice } from "@/lib/types";

export type ClaimGate = "direct" | "otp";

export async function claimOtpGate(invoice: Invoice): Promise<ClaimGate> {
  if (!invoice.client_email) return "direct";
  const settings = await loadEmailSettings(invoice.user_id);
  return settings.apiKey ? "otp" : "direct";
}

export async function sendClaimOtp(invoice: Invoice) {
  const code = await generateOtpCode();
  const admin = createAdminSupabase();

  const { data: profile } = await admin
    .from("profiles")
    .select("business_name, business_email")
    .eq("id", invoice.user_id)
    .maybeSingle();

  const { error } = await admin
    .from("invoices")
    .update({
      claim_otp_hash: await hashOtp(code),
      claim_otp_expires_at: otpExpiresAt(),
    })
    .eq("id", invoice.id);

  if (error) {
    return { ok: false as const, reason: error.message };
  }

  const settings = await loadEmailSettings(invoice.user_id);
  const businessName = profile?.business_name || "Your service provider";
  const amount = formatMoney(invoice.total_cents, invoice.currency);

  const result = await sendEmail({
    to: invoice.client_email!,
    subject: `${invoice.number} · your code`,
    text: `${businessName} here.

To confirm you have paid invoice ${invoice.number} (${amount}), enter this 6-digit code on the invoice page:

${code}

It expires in 10 minutes.

If you did not pay this invoice, ignore this email.`,
    from: senderFor(settings, businessName),
    replyTo: settings.replyTo || profile?.business_email || undefined,
    apiKey: settings.apiKey!,
  });

  return { ok: result.ok, reason: result.ok ? undefined : result.reason };
}

export async function verifyClaimOtp(invoice: Invoice, code: string) {
  if (!invoice.claim_otp_hash || otpExpired(invoice.claim_otp_expires_at)) {
    return false;
  }

  const candidate = await hashOtp(code);
  const stored = invoice.claim_otp_hash;
  if (candidate.length !== stored.length) return false;

  let match = true;
  for (let i = 0; i < candidate.length; i++) {
    if (candidate.charCodeAt(i) !== stored.charCodeAt(i)) match = false;
  }
  if (!match) return false;

  const admin = createAdminSupabase();
  await admin
    .from("invoices")
    .update({ claim_otp_hash: null, claim_otp_expires_at: null })
    .eq("id", invoice.id);

  return true;
}
