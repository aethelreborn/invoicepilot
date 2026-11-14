import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, emailConfigured } from "@/lib/email/resend";
import { reminderSubject, reminderBody } from "@/lib/email/templates";
import { DEFAULT_REMINDER_SEQUENCE } from "@/lib/types";
import { appOrigin } from "@/lib/app-url";
import type { Invoice, Profile } from "@/lib/types";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createServerSupabase();
  // Use service role would be better; anon client can't read all users' invoices under RLS.
  // For the cron to work across users, set SUPABASE_SERVICE_ROLE_KEY and use it.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let client = supabase;
  if (serviceKey) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey) as unknown as typeof supabase;
  }

  const { data: invoices } = await client
    .from("invoices")
    .select("*, invoice_line_items(*)")
    .in("status", ["sent", "viewed", "overdue"]);

  let processed = 0;
  let sent = 0;
  const origin = appOrigin(request);

  for (const row of invoices || []) {
    const invoice = row as Invoice;
    const daysSinceDue = Math.floor(
      (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const nextIndex = invoice.reminder_count;
    if (nextIndex >= DEFAULT_REMINDER_SEQUENCE.length) continue;
    const step = DEFAULT_REMINDER_SEQUENCE[nextIndex];
    if (daysSinceDue < step.dayOffset) continue;

    const { data: profile } = await client
      .from("profiles")
      .select("*")
      .eq("id", invoice.user_id)
      .single();

    const payUrl = `${origin}/pay/${invoice.pay_token}`;
    const subject = reminderSubject(invoice, step.tone);
    const text = reminderBody(invoice, step.tone, profile as Profile | null, payUrl);
    const toEmail = invoice.client_email;

    let delivered = false;
    if (emailConfigured() && toEmail) {
      const res = await sendEmail({ to: toEmail, subject, text });
      delivered = res.ok;
    }

    await client.from("reminder_logs").insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      tone: step.tone,
      channel: delivered ? "email" : "manual",
      to_email: toEmail,
      subject,
      body: text,
    });

    await client
      .from("invoices")
      .update({
        reminder_count: invoice.reminder_count + 1,
        last_reminder_at: new Date().toISOString(),
        status: daysSinceDue > 0 ? "overdue" : invoice.status,
      })
      .eq("id", invoice.id);

    processed++;
    if (delivered) sent++;
  }

  return NextResponse.json({ processed, sent, email_configured: emailConfigured() });
}