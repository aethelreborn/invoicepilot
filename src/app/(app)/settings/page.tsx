"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const label =
  "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted";
const field =
  "w-full border border-rule bg-card px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-ink";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "NZD"];

type ProviderId = "upi" | "razorpay" | "stripe" | "youpi" | "custom";


type PaymentDraft = {
  provider: ProviderId;
  upi_vpa: string;
  upi_name: string;
  bank_details: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_webhook_secret: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  youpi_base_url: string;
  youpi_merchant_id: string;
  youpi_webhook_secret: string;
  custom_webhook_secret: string;
};


type Templates = Record<string, { subject: string; body: string }>;

type ToneKey = "friendly" | "firm" | "final";

const TONE_KEYS: ToneKey[] = ["friendly", "firm", "final"];


const EMPTY_TEMPLATE_DRAFTS: Record<ToneKey, { subject: string; body: string }> = {
  friendly: { subject: "", body: "" },
  firm: { subject: "", body: "" },
  final: { subject: "", body: "" },
};

export default function SettingsPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [tone, setTone] = useState("friendly");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);

  const [emailDraft, setEmailDraft] = useState({
    resend_api_key: "",
    from_name: "",
    from_email: "",
    reply_to: "",
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  const [templateDrafts, setTemplateDrafts] = useState<Record<ToneKey, { subject: string; body: string }>>(EMPTY_TEMPLATE_DRAFTS);
  const [savingTemplate, setSavingTemplate] = useState<ToneKey | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setBusinessName(d.profile.business_name || "");
          setBusinessEmail(d.profile.business_email || "");
          setCurrency(d.profile.currency || "INR");
          setTone(d.profile.reminder_tone || "friendly");
        }
      });
    fetch("/api/settings/payments")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setDraft({
            provider: d.settings.provider || "upi",
            upi_vpa: d.settings.upi_vpa || "",
            upi_name: d.settings.upi_name || "",
            bank_details: d.settings.bank_details || "",
            razorpay_key_id: d.settings.razorpay_key_id || "",
            razorpay_key_secret: "",
            razorpay_webhook_secret: "",
            stripe_publishable_key: d.settings.stripe_publishable_key || "",
            stripe_secret_key: "",
            stripe_webhook_secret: "",
            youpi_base_url: d.settings.youpi_base_url || "",
            youpi_merchant_id: d.settings.youpi_merchant_id || "",
            youpi_webhook_secret: "",
            custom_webhook_secret: "",
          });
        }
      });
    fetch("/api/settings/email")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setEmailDraft({
            resend_api_key: "",
            from_name: d.settings.from_name || "",
            from_email: d.settings.from_email || "",
            reply_to: d.settings.reply_to || "",
          });
        }
      });
    fetch("/api/settings/templates")
      .then((r) => r.json())
      .then((d) => {
        const next: Templates = d.templates || {};
        const drafts = { friendly: { subject: "", body: "" }, firm: { subject: "", body: "" }, final: { subject: "", body: "" } };
        for (const key of TONE_KEYS) {
          drafts[key] = { subject: next[key]?.subject || "", body: next[key]?.body || "" };
        }
        setTemplateDrafts(drafts);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: businessName,
        business_email: businessEmail || null,
        currency,
        reminder_tone: tone,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved." : "Failed to save.");
  }

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    setPaymentMsg(null);
    if (!draft) return;
    const res = await fetch("/api/settings/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: draft.provider,
        upi_vpa: draft.provider === "upi" ? draft.upi_vpa || null : null,
        upi_name: draft.provider === "upi" ? draft.upi_name || null : null,
        bank_details: draft.bank_details || null,
        razorpay_key_id: draft.provider === "razorpay" ? draft.razorpay_key_id || null : null,
        razorpay_key_secret: draft.razorpay_key_secret || null,
        razorpay_webhook_secret: draft.razorpay_webhook_secret || null,
        stripe_publishable_key: draft.stripe_publishable_key || null,
        stripe_secret_key: draft.stripe_secret_key || null,
        stripe_webhook_secret: draft.stripe_webhook_secret || null,
        youpi_base_url: draft.provider === "youpi" ? draft.youpi_base_url || null : null,
        youpi_merchant_id: draft.provider === "youpi" ? draft.youpi_merchant_id || null : null,
        youpi_webhook_secret: draft.youpi_webhook_secret || null,
        custom_webhook_secret: draft.custom_webhook_secret || null,
      }),
    });
    setSavingPayment(false);
    const d = await res.json();
    if (res.ok) {
      setPaymentMsg("Payment settings saved.");
    } else {
      setPaymentMsg(d.error || "Failed to save.");
    }
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            provider: draft.provider,
            upi_vpa: draft.provider === "upi" ? draft.upi_vpa : "",
            upi_name: draft.provider === "upi" ? draft.upi_name : "",
            razorpay_key_id: draft.provider === "razorpay" ? draft.razorpay_key_id : "",
            youpi_base_url: draft.provider === "youpi" ? draft.youpi_base_url : "",
            youpi_merchant_id: draft.provider === "youpi" ? draft.youpi_merchant_id : "",
          }
        : prev
    );
    router.refresh();
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMsg(null);
    const res = await fetch("/api/settings/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resend_api_key: emailDraft.resend_api_key || undefined,
        from_name: emailDraft.from_name || null,
        from_email: emailDraft.from_email || null,
        reply_to: emailDraft.reply_to || null,
      }),
    });
    setSavingEmail(false);
    const d = await res.json();
    if (res.ok) {
      setEmailMsg("Email settings saved.");
    } else {
      setEmailMsg(d.error || "Failed to save.");
    }
  }

  async function saveTemplate(key: ToneKey) {
    const draft = templateDrafts[key];
    if (!draft.subject || !draft.body) return;
    setSavingTemplate(key);
    const res = await fetch("/api/settings/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [key]: { subject: draft.subject, body: draft.body },
      }),
    });
    setSavingTemplate(null);
    const d = await res.json();
    if (res.ok) {
      setTemplateDrafts((prev) => ({
        ...prev,
        [key]: { subject: d.templates[key]?.subject || draft.subject, body: d.templates[key]?.body || draft.body },
      }));
    }
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const d = await res.json();
    setImportMsg(
      `Imported ${d.imported || 0} invoices.${d.errors?.length ? " Errors: " + d.errors.join(", ") : ""}`
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto w-full max-w-[860px] px-6 py-10 md:px-10 md:py-12">
        <div className="border-b border-rule pb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Workspace</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
            Settings
          </h1>
        </div>
        <p className="mt-8 text-[12px] text-muted">Loading payment settings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 py-10 md:px-10 md:py-12">
      <div className="border-b border-rule pb-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Workspace</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
          Settings
        </h1>
      </div>

      <form onSubmit={save} className="mt-8 border border-rule bg-card">
        <SectionHead title="Business profile" />
        <div className="space-y-4 p-5 md:p-6">
          <div>
            <label htmlFor="businessName" className={label}>
              Business name
            </label>
            <input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="businessEmail" className={label}>
              Business email — used as the reply-to on reminders
            </label>
            <input id="businessEmail" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className={field} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="currency" className={label}>
                Default currency
              </label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={field}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tone" className={label}>
                Default reminder tone
              </label>
              <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={field}>
                <option value="friendly">Friendly</option>
                <option value="firm">Firm</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>
          {msg && <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{msg}</p>}
        </div>
        <div className="flex justify-end border-t border-rule px-5 py-4 md:px-6">
          <button type="submit" disabled={saving} className="flex h-10 items-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="mt-6 border border-rule bg-card">
        <SectionHead title="Payment method" />
        <form onSubmit={savePayment} className="mt-4 p-5 md:p-6">
          <div className="space-y-4">
            <Field
              label="Active provider"
              value={draft.provider}
              onChange={(v) => setDraft({ ...draft, provider: v as ProviderId })}
              select
              options={["upi", "razorpay", "stripe", "youpi", "custom"].map((value) => ({
                value,
                label:
                  value === "upi"
                    ? "UPI QR (client pays, you confirm)"
                    : value === "razorpay"
                      ? "Razorpay"
                      : value === "stripe"
                        ? "Stripe"
                        : value === "youpi"
                          ? "YouPI gateway"
                          : "Custom signed webhook",
              }))}
            />
            {draft.provider === "upi" && (
              <>
                <Field label="Recipient UPI ID" value={draft.upi_vpa} onChange={(v) => setDraft({ ...draft, upi_vpa: v })} placeholder="you@bank" />
                <Field label="Display name" value={draft.upi_name} onChange={(v) => setDraft({ ...draft, upi_name: v })} />
              </>
            )}
            <Field label="Bank transfer details" value={draft.bank_details} onChange={(v) => setDraft({ ...draft, bank_details: v })} textarea rows={3} />
            {draft.provider === "razorpay" && (
              <>
                <Field label="Razorpay key ID" value={draft.razorpay_key_id} onChange={(v) => setDraft({ ...draft, razorpay_key_id: v })} placeholder="rzp_…" />
                <Field label="Razorpay key secret" secret value={draft.razorpay_key_secret} onChange={(v) => setDraft({ ...draft, razorpay_key_secret: v })} />
                <Field label="Razorpay webhook secret" secret value={draft.razorpay_webhook_secret} onChange={(v) => setDraft({ ...draft, razorpay_webhook_secret: v })} />
              </>
            )}
            {draft.provider === "stripe" && (
              <>
                <Field label="Stripe publishable key" value={draft.stripe_publishable_key} onChange={(v) => setDraft({ ...draft, stripe_publishable_key: v })} />
                <Field label="Stripe secret key" secret value={draft.stripe_secret_key} onChange={(v) => setDraft({ ...draft, stripe_secret_key: v })} />
                <Field label="Stripe webhook secret" secret value={draft.stripe_webhook_secret} onChange={(v) => setDraft({ ...draft, stripe_webhook_secret: v })} />
              </>
            )}
            {draft.provider === "youpi" && (
              <>
                <Field label="YouPI base URL" value={draft.youpi_base_url} onChange={(v) => setDraft({ ...draft, youpi_base_url: v })} placeholder="https://youpi.example.com" />
                <Field label="YouPI merchant ID" value={draft.youpi_merchant_id} onChange={(v) => setDraft({ ...draft, youpi_merchant_id: v })} />
                <Field label="YouPI webhook secret" secret value={draft.youpi_webhook_secret} onChange={(v) => setDraft({ ...draft, youpi_webhook_secret: v })} />
              </>
            )}
            {draft.provider === "custom" && (
              <Field label="Custom webhook secret" secret value={draft.custom_webhook_secret} onChange={(v) => setDraft({ ...draft, custom_webhook_secret: v })} />
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={savingPayment} className="flex h-10 items-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50">
              {savingPayment ? "Saving…" : "Save payment settings"}
            </button>
            {paymentMsg && <span className="text-[12px] text-ink-soft">{paymentMsg}</span>}
          </div>
        </form>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <SectionHead title="Email delivery" />
        <form onSubmit={saveEmail} className="mt-4 p-5 md:p-6">
          <div className="space-y-4">
            <Field label="Resend API key" secret type="password" value={emailDraft.resend_api_key} onChange={(v) => setEmailDraft({ ...emailDraft, resend_api_key: v })} placeholder="re_…" />
            <Field label="From name" value={emailDraft.from_name} onChange={(v) => setEmailDraft({ ...emailDraft, from_name: v })} />
            <Field label="From address" type="email" value={emailDraft.from_email} onChange={(v) => setEmailDraft({ ...emailDraft, from_email: v })} />
            <Field label="Reply-to" type="email" value={emailDraft.reply_to} onChange={(v) => setEmailDraft({ ...emailDraft, reply_to: v })} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={savingEmail} className="flex h-10 items-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50">
              {savingEmail ? "Saving…" : "Save email settings"}
            </button>
            {emailMsg && <span className="text-[12px] text-ink-soft">{emailMsg}</span>}
          </div>
        </form>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <SectionHead title="Reminder templates" />
        <div className="p-5 md:p-6">
          {TONE_KEYS.map((key) => (
            <div key={key} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between">
                <label htmlFor={`tpl-${key}`} className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                  {key} tone
                </label>
                <button
                  onClick={() => saveTemplate(key)}
                  disabled={savingTemplate === key || !templateDrafts[key]?.subject || !templateDrafts[key]?.body}
                  className="flex h-8 items-center border border-ink px-3 text-[10px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
                >
                  {savingTemplate === key ? "Saving…" : "Save tone"}
                </button>
              </div>
              <div className="mt-3 grid gap-3">
                <Field label={`Template subject — ${key}`} value={templateDrafts[key]?.subject || ""} onChange={(v) => setTemplateDrafts({ ...templateDrafts, [key]: { ...templateDrafts[key], subject: v } })} placeholder="Subject" />
                <Field label={`Template body — ${key}`} value={templateDrafts[key]?.body || ""} onChange={(v) => setTemplateDrafts({ ...templateDrafts, [key]: { ...templateDrafts[key], body: v } })} placeholder={"Body — use {{client_name}}, {{invoice_number}}, {{amount}}, {{due_date}}, {{business_name}}, {{pay_url}}"} textarea rows={5} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <SectionHead title="Import invoices" />
        <div className="space-y-3 p-5 md:p-6">
          <p className="text-[12px] leading-relaxed text-muted">
            Upload a CSV with these columns:{" "}
            <code className="font-mono text-[11px] text-ink-soft">
              client_name, client_email, number, issue_date, due_date, total, status, notes, description
            </code>
            . Rows are validated before anything is written.
          </p>
          <input type="file" accept=".csv" onChange={importCsv} className="block w-full border border-rule bg-paper px-3 py-2 text-[12px] text-ink-soft file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[9px] file:uppercase file:tracking-[0.14em] file:text-paper" />
          {importMsg && <p className="text-[12px] text-ink-soft">{importMsg}</p>}
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <SectionHead title="Privacy and data" />
        <div className="p-5 md:p-6">
          <p className="text-[12px] leading-relaxed text-muted">
            Export everything you have entered as JSON, or delete your account. Deletion is permanent and cannot be undone.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/api/account/export" className="flex h-9 items-center border border-rule px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink">
              Export data (JSON)
            </a>
            <button
              onClick={async () => {
                if (!confirm("Delete your account and all data? This cannot be undone.")) return;
                const res = await fetch("/api/account/delete", { method: "DELETE" });
                if (res.ok) {
                  router.push("/signup");
                  router.refresh();
                }
              }}
              className="flex h-9 items-center border border-stamp/40 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-stamp transition-colors hover:bg-stamp/[0.06]"
            >
              Delete account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  secret,
  placeholder,
  select,
  textarea,
  rows,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  secret?: boolean;
  placeholder?: string;
  select?: boolean;
  textarea?: boolean;
  rows?: number;
  options?: { value: string; label: string }[];
}) {
  const id = `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const [visible, setVisible] = useState(false);
  const masked = Boolean(secret) && !visible;

  return (
    <div>
      <label htmlFor={id} className={label}>
        {label}
      </label>
      {textarea ? (
        <textarea id={id} rows={rows || 3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={field} />
      ) : select ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={field}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={masked ? "password" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={field}
        />
      )}
      {secret && (
        <button type="button" onClick={() => setVisible((v) => !v)} className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted underline-offset-2 hover:underline">
          {visible ? "Hide" : "Show"}
        </button>
      )}
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted md:px-6">
      {title}
    </h2>
  );
}
