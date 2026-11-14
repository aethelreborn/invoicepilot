import type { Invoice, Client, Profile, ReminderTone } from "@/lib/types";
import { DEMO_USER } from "@/lib/demo";

type DemoPaymentSettings = {
  provider: "upi" | "razorpay" | "stripe" | "youpi" | "custom";
  upi_vpa: string | null;
  upi_name: string | null;
  bank_details: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
  razorpay_webhook_secret: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  youpi_base_url: string | null;
  youpi_merchant_id: string | null;
  youpi_webhook_secret: string | null;
  custom_webhook_secret: string | null;
};

type DemoEmailSettings = {
  resend_api_key: string | null;
  from_name: string | null;
  from_email: string | null;
  reply_to: string | null;
};

type Store = {
  profile: Profile;
  clients: Client[];
  invoices: (Invoice & { invoice_line_items: { id: string; description: string; quantity: number; unit_price_cents: number; sort_order: number }[] })[];
  reminders: { id: string; invoice_id: string; user_id: string; tone: string; channel: string; to_email: string | null; subject: string | null; body: string | null; sent_at: string }[];
  paymentSettings: DemoPaymentSettings;
  emailSettings: DemoEmailSettings;
  templates: { tone: ReminderTone; subject: string; body: string }[];
  nextId: number;
};

function makeStore(): Store {
  const now = new Date().toISOString();
  return {
    profile: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      business_name: DEMO_USER.business_name,
      business_email: "hello@demostudio.com",
      logo_url: null,
      currency: "INR",
      reminder_tone: "friendly",
      plan: "free",
      created_at: now,
      updated_at: now,
    },
    clients: [
      { id: "c1", user_id: DEMO_USER.id, name: "Harbor & Pine", email: "billing@harborandpine.com", company: "Harbor & Pine", phone: null, notes: null, created_at: now, updated_at: now },
      { id: "c2", user_id: DEMO_USER.id, name: "Kestrel Labs", email: "ap@kestrellabs.com", company: "Kestrel Labs", phone: null, notes: null, created_at: now, updated_at: now },
    ],
    invoices: [
      {
        id: "inv1", user_id: DEMO_USER.id, client_id: "c1", client_name: "Harbor & Pine", client_email: "billing@harborandpine.com",
        number: "INV-202611-1001", title: "Website redesign", status: "overdue",
        issue_date: "2026-10-20", due_date: "2026-11-03", currency: "INR",
        subtotal_cents: 120000, tax_cents: 0, total_cents: 120000, notes: "Bank transfer â€” reference INV-202611-1001.",
        pay_token: "demo-token-1", reminder_count: 1, last_reminder_at: now, paid_at: null, viewed_at: null,
        created_at: now, updated_at: now,
        invoice_line_items: [{ id: "li1", description: "Design work", quantity: 1, unit_price_cents: 120000, sort_order: 0 }],
      },
      {
        id: "inv2", user_id: DEMO_USER.id, client_id: "c2", client_name: "Kestrel Labs", client_email: "ap@kestrellabs.com",
        number: "INV-202611-1002", title: "Monthly retainer", status: "sent",
        issue_date: "2026-11-01", due_date: "2026-11-28", currency: "INR",
        subtotal_cents: 308000, tax_cents: 0, total_cents: 308000, notes: null,
        pay_token: "demo-token-2", reminder_count: 0, last_reminder_at: null, paid_at: null, viewed_at: null,
        created_at: now, updated_at: now,
        invoice_line_items: [{ id: "li2", description: "Retainer - November", quantity: 1, unit_price_cents: 308000, sort_order: 0 }],
      },
      {
        id: "inv3", user_id: DEMO_USER.id, client_id: "c1", client_name: "Harbor & Pine", client_email: "billing@harborandpine.com",
        number: "INV-202610-1003", title: "Logo package", status: "paid",
        issue_date: "2026-10-01", due_date: "2026-10-15", currency: "INR",
        subtotal_cents: 94000, tax_cents: 0, total_cents: 94000, notes: null,
        pay_token: "demo-token-3", reminder_count: 0, last_reminder_at: null, paid_at: now, viewed_at: now,
        created_at: now, updated_at: now,
        invoice_line_items: [{ id: "li3", description: "Logo design", quantity: 1, unit_price_cents: 94000, sort_order: 0 }],
      },
    ],
    reminders: [],
    paymentSettings: {
      provider: "upi",
      upi_vpa: "invoicepilot@upi",
      upi_name: "Demo Studio",
      bank_details: null,
      razorpay_key_id: null,
      razorpay_key_secret: null,
      razorpay_webhook_secret: null,
      stripe_publishable_key: null,
      stripe_secret_key: null,
      stripe_webhook_secret: null,
      youpi_base_url: null,
      youpi_merchant_id: null,
      youpi_webhook_secret: null,
      custom_webhook_secret: null,
    },
    emailSettings: {
      resend_api_key: null,
      from_name: null,
      from_email: null,
      reply_to: null,
    },
    templates: [],
    nextId: 100,
  };
}

// Global singleton (persists across requests in dev; resets on server restart)
const g = globalThis as unknown as { __demoStore?: Store };
if (!g.__demoStore) g.__demoStore = makeStore();
export const demoStore = g.__demoStore;

export function genId(prefix = "id") {
  const n = ++g.__demoStore!.nextId;
  return `${prefix}${n}`;
}