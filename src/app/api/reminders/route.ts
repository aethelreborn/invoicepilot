import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";
import { loadTemplates } from "@/lib/email/templates-store";
import { loadEmailSettings, senderFor, type EmailSettings } from "@/lib/email/settings";
import { sendEmail } from "@/lib/email/resend";
import { appOrigin } from "@/lib/app-url";
import { formatMoney } from "@/lib/currency";
import { renderReminder, renderReminderHtml, type ReminderTemplate } from "@/lib/reminders";
import type { Invoice, Profile, ReminderTone } from "@/lib/types";

const schema = z.object({
  invoice_id: z.string().uuid(),
  tone: z.enum(["friendly", "firm", "final"]).optional(),
  channel: z.enum(["email", "manual"]).default("email"),
});

export async function POST(request: NextRequest) {
  const origin = appOrigin(request);

  async function sendReminder(input: {
    invoice: Invoice;
    profile: Profile;
    tone: ReminderTone;
    template: ReminderTemplate;
    toEmail: string | null;
    channel: "email" | "manual";
    emailSettings: EmailSettings | null;
  }) {
    const payUrl = `${origin}/api/pay/${input.invoice.pay_token}`;
    const vars = buildVars(input.invoice, input.profile, payUrl);
    const rendered = renderReminder(input.template, vars);

    let sent = false;
    let sendReason: string | null = null;

    if (input.channel === "email" && input.toEmail && input.emailSettings?.apiKey) {
      const res = await sendEmail({
        to: input.toEmail,
        subject: rendered.subject,
        text: rendered.body,
        html: renderReminderHtml({
          businessName: input.profile.business_name || "InvoicePilot",
          amount: vars.amount,
          invoiceNumber: input.invoice.number,
          dueDate: vars.due_date,
          payUrl: vars.pay_url,
          qrUrl: qrUrlFor(input.invoice.pay_token, origin),
          message: rendered.body,
        }),
        from: senderFor(input.emailSettings, input.profile.business_name),
        replyTo: input.emailSettings.replyTo || undefined,
        apiKey: input.emailSettings.apiKey,
      });
      sent = res.ok;
      if (!res.ok) sendReason = res.reason;
    } else if (input.channel === "email") {
      sendReason = "no_api_key";
    }

    return { sent, sendReason, subject: rendered.subject, body: rendered.body };
  }

  if (isDemoMode()) {
    const body = await request.json();
    const demoSchema = z.object({
      invoice_id: z.string().min(1),
      tone: z.enum(["friendly", "firm", "final"]).optional(),
      channel: z.enum(["email", "manual"]).default("email"),
    });
    const parsed = demoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { invoice_id, tone: toneOverride, channel } = parsed.data;
    const invoice = demoStore.invoices.find((i) => i.id === invoice_id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const profile = demoStore.profile;
    const tone: ReminderTone = toneOverride || (profile.reminder_tone ?? "friendly");
    const emailSettings: EmailSettings | null = demoStore.emailSettings.resend_api_key
      ? {
          apiKey: demoStore.emailSettings.resend_api_key,
          fromName: demoStore.emailSettings.from_name,
          fromEmail: demoStore.emailSettings.from_email,
          replyTo: demoStore.emailSettings.reply_to,
        }
      : null;
    const template = (await loadTemplates("demo-user-1"))[tone];

    const result = await sendReminder({
      invoice: invoice as Invoice,
      profile: profile as Profile,
      tone,
      template,
      toEmail: invoice.client_email,
      channel,
      emailSettings,
    });

    demoStore.reminders.unshift({
      id: `r${Date.now()}`,
      invoice_id: invoice.id,
      user_id: "demo-user-1",
      tone,
      channel: result.sent ? "email" : "manual",
      to_email: invoice.client_email,
      subject: result.subject,
      body: result.body,
      sent_at: new Date().toISOString(),
    });
    invoice.reminder_count = (invoice.reminder_count || 0) + 1;
    invoice.last_reminder_at = new Date().toISOString();
    if (invoice.status === "draft") invoice.status = "sent";
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      channel: result.sent ? "email" : "manual",
      reason: result.sendReason,
      email_configured: Boolean(emailSettings?.apiKey),
      subject: result.subject,
      body: result.body,
      to: invoice.client_email,
    });
  }

  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { invoice_id, tone: toneOverride, channel } = parsed.data;

  const { data: invoiceRow } = await supabase
    .from("invoices")
    .select("*, invoice_line_items(*)")
    .eq("id", invoice_id)
    .eq("user_id", user!.id)
    .single();

  if (!invoiceRow) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const invoice = invoiceRow as Invoice;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const tone: ReminderTone = toneOverride || (profile?.reminder_tone ?? "friendly");
  const template: ReminderTemplate = (await loadTemplates(user!.id))[tone];
  const emailSettings = await loadEmailSettings(user!.id);

  const result = await sendReminder({
    invoice,
    profile: (profile as Profile) || ({} as Profile),
    tone,
    template,
    toEmail: invoice.client_email,
    channel,
    emailSettings,
  });

  await supabase.from("reminder_logs").insert({
    invoice_id: invoice.id,
    user_id: user!.id,
    tone,
    channel: result.sent ? "email" : "manual",
    to_email: invoice.client_email ?? null,
    subject: result.subject,
    body: result.body,
  });

  await supabase
    .from("invoices")
    .update({
      reminder_count: invoice.reminder_count + 1,
      last_reminder_at: new Date().toISOString(),
      status: invoice.status === "draft" ? "sent" : invoice.status,
    })
    .eq("id", invoice.id);

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    channel: result.sent ? "email" : "manual",
    reason: result.sendReason,
    email_configured: Boolean(emailSettings?.apiKey),
    subject: result.subject,
    body: result.body,
    to: invoice.client_email,
  });
}

function buildVars(invoice: Invoice, profile: Profile, payUrl: string) {
  return {
    client_name: invoice.client_name,
    invoice_number: invoice.number,
    amount: formatMoney(invoice.total_cents, invoice.currency),
    due_date: new Date(invoice.due_date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    business_name: profile.business_name || "your service provider",
    pay_url: payUrl,
  };
}

function qrUrlFor(token: string, origin: string) {
  return `${origin}/api/pay/${token}/qr.png`;
}
