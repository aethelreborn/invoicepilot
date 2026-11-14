import type { Invoice, ReminderTone, Profile } from "@/lib/types";

export function reminderSubject(invoice: Invoice, tone: ReminderTone) {
  const base = `Invoice ${invoice.number} — ${invoice.client_name}`;
  if (tone === "friendly") return `Friendly reminder: ${base}`;
  if (tone === "firm") return `Following up: ${base}`;
  return `Final notice: ${base}`;
}

export function reminderBody(invoice: Invoice, tone: ReminderTone, profile: Profile | null, payUrl: string) {
  const name = profile?.business_name || "your service provider";
  const email = profile?.business_email || "";
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: invoice.currency,
  }).format(invoice.total_cents / 100);
  const due = new Date(invoice.due_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greet = `Hi ${invoice.client_name},`;
  const sign = `\n\nThanks,\n${name}${email ? `\n${email}` : ""}`;
  const footer = `\n\n---\nYou're receiving this because ${name} sent you an invoice. Reply to this email to reach them directly.\n${name}${email ? ` · ${email}` : ""}`;

  if (tone === "friendly") {
    return `${greet}\n\nJust a friendly heads-up that invoice ${invoice.number} for ${total} is due on ${due}. You can review and pay it here:\n${payUrl}\n\nLet me know if you have any questions.${sign}${footer}`;
  }
  if (tone === "firm") {
    return `${greet}\n\nFollowing up on invoice ${invoice.number} for ${total}, which was due on ${due}. Could you let me know when I can expect payment?\n\nPay here: ${payUrl}${sign}${footer}`;
  }
  return `${greet}\n\nThis is a final notice for invoice ${invoice.number} for ${total}, due ${due}. Please send payment, or reply today and tell me when it will arrive.\n\nPay here: ${payUrl}${sign}${footer}`;
}