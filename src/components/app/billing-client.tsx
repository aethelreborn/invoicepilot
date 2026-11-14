"use client";

import { useEffect, useState } from "react";
import { PLANS, formatPrice, type BillingInterval } from "@/lib/plans";

type PlatformPayment = {
  id: string;
  plan: string;
  interval: string | null;
  amount_cents: number;
  currency: string;
  reference: string;
  status: string;
  utr: string | null;
  created_at: string;
};

type ProfileSummary = {
  plan: string;
  plan_renews_at: string | null;
};

const labelClass = "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted";
const inputClass = "w-full border border-rule bg-card px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-ink";

export default function BillingClient() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [payment, setPayment] = useState<PlatformPayment | null>(null);
  const [plan, setPlan] = useState<"starter" | "growth">("starter");
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<PlatformPayment[]>([]);

  async function refresh() {
    const res = await fetch("/api/billing/payments");
    const data = await res.json();
    const next = (data.payments || []) as PlatformPayment[];
    setHistory(next);
    setProfile((data.profile || null) as ProfileSummary | null);
    const latest = next[0] || null;
    setPayment(latest);
    if (latest?.status === "pending") {
      setQrUri(
        `/api/billing/qr.png?pa=${encodeURIComponent(process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || "8091056604@fam")}&am=${encodeURIComponent((latest.amount_cents / 100).toFixed(2))}&pn=${encodeURIComponent("InvoicePilot")}&tn=${encodeURIComponent(`Subscription ${latest.reference}`)}`
      );
    } else {
      setQrUri(null);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  async function upgrade() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/billing/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setPayment(data.payment);
      setQrUri(null);
      await refresh();
      setMsg("Payment request created. Scan the QR with your UPI app.");
    } else {
      setMsg(data.error || "Could not create the payment request.");
    }
  }

  async function submitUtr() {
    if (!payment) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/billing/payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utr }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("UTR submitted. The administrator will confirm the payment.");
      await refresh();
    } else {
      const data = await res.json();
      setMsg(data.error || "Could not submit the UTR.");
    }
  }

  const currentPlan = profile?.plan || "free";
  const renewDate = profile?.plan_renews_at
    ? new Date(profile.plan_renews_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  if (payment?.status === "submitted" || payment?.status === "paid") {
    return (
      <div className="mt-4 border border-stamp/40 bg-stamp/[0.06] p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stamp">
          Subscription {payment.status}
        </p>
        <p className="mt-1.5 text-[12px] text-ink-soft">
          {payment.status === "submitted"
            ? "UTR recorded. Awaiting platform verification."
            : `${currentPlan === "free" ? "Starter" : currentPlan[0].toUpperCase() + currentPlan.slice(1)} is active until ${renewDate || "—"}.`}
        </p>
      </div>
    );
  }

  const selected = PLANS[plan];
  const price = interval === "monthly" ? selected.monthlyCents : selected.annualCents;

  return (
    <div className="mt-4">
      {currentPlan !== "free" && (
        <div className="mb-4 border border-rule bg-paper-deep/50 p-3 text-[12px] text-ink-soft">
          You are on <span className="font-medium text-ink">{currentPlan === "starter" ? "Starter" : "Growth"}</span>
          {renewDate ? <>, renewing <span className="text-ink">{renewDate}</span>. Cancel by not renewing — it simply lapses to Free.</> : null}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex border border-rule">
          {(["starter", "growth"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex h-9 items-center px-4 text-[12px] font-medium transition-colors ${plan === p ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {PLANS[p].label}
            </button>
          ))}
        </div>
        <div className="inline-flex border border-rule">
          {(["monthly", "annual"] as const).map((i) => (
            <button
              key={i}
              onClick={() => setBillingInterval(i)}
              className={`flex h-9 items-center px-4 text-[12px] font-medium transition-colors ${interval === i ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
            >
              {i === "monthly" ? "Monthly" : "Annual · 2 months free"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={upgrade}
        disabled={busy}
        className="mt-3 flex h-12 w-full items-center justify-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
      >
        {busy ? "Creating…" : `Upgrade to ${selected.label} — ${formatPrice(price)}${interval === "monthly" ? "/month" : "/year"}`}
      </button>

      {qrUri && (
        <div className="mt-4 border border-rule bg-card p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUri} alt="UPI QR for InvoicePilot subscription" width={180} height={180} className="mx-auto block border border-rule bg-paper" />
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Scan to pay ₹{((payment?.amount_cents || 0) / 100).toFixed(0)} to {process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || "8091056604@fam"}</p>
          <p className="mt-2 text-[11px] text-ink-soft">The administrator confirms once the UTR clears.</p>
        </div>
      )}

      {payment && payment.status === "pending" && (
        <div className="mt-4">
          <label className={labelClass}>UTR from your bank app</label>
          <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. UPI20261114001" className={inputClass} />
          <button
            onClick={submitUtr}
            disabled={busy || !utr.trim()}
            className="mt-3 flex h-10 w-full items-center justify-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            Submit UTR
          </button>
        </div>
      )}

      {msg && <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{msg}</p>}

      {history.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">History</p>
          <ul className="mt-2 space-y-1 text-[12px] text-ink-soft">
            {history.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-rule pb-1 last:border-b-0">
                <span className="font-mono text-[10px]">{p.reference}</span>
                <span className="font-mono text-[10px]">{p.plan}{p.interval === "annual" ? " · annual" : ""}</span>
                <span className="font-mono text-[10px]">{p.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
