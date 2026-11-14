export type InvoiceStatus = "draft" | "sent" | "viewed" | "claimed" | "paid" | "overdue" | "void";

export type ReminderTone = "friendly" | "firm" | "final";

export interface Profile {
  id: string;
  email: string;
  business_name: string | null;
  business_email: string | null;
  logo_url: string | null;
  currency: string;
  reminder_tone: ReminderTone;
  plan?: "free" | "starter";
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  number: string;
  title: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  notes: string | null;
  pay_token: string;
  reminder_count: number;
  last_reminder_at: string | null;
  paid_at: string | null;
  viewed_at: string | null;
  claim_otp_hash?: string | null;
  claim_otp_expires_at?: string | null;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
  client?: Client;
}

export interface ReminderLog {
  id: string;
  invoice_id: string;
  user_id: string;
  tone: ReminderTone;
  sent_at: string;
  channel: "email" | "manual";
  to_email: string | null;
  subject: string | null;
  body: string | null;
}

export interface ReminderSequenceStep {
  dayOffset: number; // relative to due_date: negative = before, 0 = on due, positive = after
  tone: ReminderTone;
  label: string;
}

export const DEFAULT_REMINDER_SEQUENCE: ReminderSequenceStep[] = [
  { dayOffset: -3, tone: "friendly", label: "Friendly heads-up (3 days before due)" },
  { dayOffset: 0, tone: "friendly", label: "Due today" },
  { dayOffset: 3, tone: "firm", label: "First follow-up (3 days overdue)" },
  { dayOffset: 7, tone: "firm", label: "Second follow-up (7 days overdue)" },
  { dayOffset: 14, tone: "final", label: "Final notice (14 days overdue)" },
];

export interface DashboardStats {
  outstanding_cents: number;
  overdue_cents: number;
  paid_this_month_cents: number;
  invoice_count: number;
  overdue_count: number;
  avg_days_to_pay: number | null;
}