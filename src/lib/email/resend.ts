import { Resend } from "resend";

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  apiKey?: string;
};

export async function sendEmail(opts: SendArgs) {
  const key = opts.apiKey || process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, reason: "no_api_key" };

  const from = opts.from || process.env.RESEND_FROM || "InvoicePilot <onboarding@resend.dev>";

  try {
    const client = new Resend(key);
    const res = await client.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });

    if (res.error) return { ok: false as const, reason: res.error.message };
    return { ok: true as const, id: res.data?.id };
  } catch (error) {
    return { ok: false as const, reason: (error as Error).message };
  }
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
