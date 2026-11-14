"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  targetEmail: string;
  currentPlan: string;
};

export default function AdminUserActions({ userId, targetEmail, currentPlan }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function setPlan(plan: "free" | "starter" | "growth") {
    setBusy(plan);
    setMsg(null);
    const res = await fetch(`/api/admin/users/${userId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    setConfirmCancel(false);
    if (res.ok) {
      setMsg(`Plan changed to ${plan}.`);
      router.refresh();
    } else {
      setMsg(data.error || "Could not update the plan.");
    }
  }

  async function deleteAccount() {
    setBusy("delete");
    setMsg(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
      return;
    }
    setConfirmDelete(false);
    setMsg(data.error || "Could not delete the account.");
  }

  const canDelete = confirmEmail.trim().toLowerCase() === targetEmail.trim().toLowerCase() && confirmDelete;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Grant plan</p>
        <p className="mt-1 text-[11px] text-muted">Adds 30 days of the plan. Repeat billing is manual — they can pay the UPI QR any time.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["starter", "growth"] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setPlan(plan)}
              disabled={busy !== null || currentPlan === plan}
              className="flex h-9 items-center border border-ink px-3 text-[11px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              {busy === plan ? "Applying…" : `Grant ${plan === "starter" ? "Starter" : "Growth"} — 30 days`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Cancel subscription</p>
        <p className="mt-1 text-[11px] text-muted">Demotes them to Free immediately. Invoices over the Free limit are not deleted.</p>
        {!confirmCancel ? (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={busy !== null || currentPlan === "free"}
            className="mt-2 flex h-9 items-center border border-rule bg-card px-3 text-[11px] text-ink-soft transition-colors hover:border-stamp hover:text-stamp disabled:opacity-40"
          >
            Cancel to Free
          </button>
        ) : (
          <div className="mt-2 border border-stamp/40 bg-stamp/[0.06] p-3">
            <p className="text-[11px] text-stamp">They lose Starter/Growth features at once. Continue?</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setPlan("free")} disabled={busy === "free"} className="flex h-8 items-center bg-stamp px-3 text-[11px] font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50">
                {busy === "free" ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button onClick={() => setConfirmCancel(false)} className="flex h-8 items-center px-3 text-[11px] text-muted hover:text-ink">
                Keep plan
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-stamp/40 bg-stamp/[0.04] p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stamp">Danger zone</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
          Deletes the account and every invoice, client, payment setting and reminder it owns.
          Subscription payment rows are kept (user unlinked) as an audit trail. This cannot be undone.
        </p>
        <label className="mt-3 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Type {targetEmail} to confirm
        </label>
        <input
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          className="mt-1.5 w-full border border-rule bg-card px-3 py-2 text-[12px] text-ink outline-none placeholder:text-muted/50 focus:border-stamp"
          autoComplete="off"
          spellCheck={false}
        />
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={confirmEmail.trim().toLowerCase() !== targetEmail.trim().toLowerCase() || busy !== null}
            className="mt-3 flex h-9 items-center border border-stamp px-3 text-[11px] font-medium text-stamp transition-colors hover:bg-stamp hover:text-paper disabled:opacity-40"
          >
            Delete account
          </button>
        ) : (
          <div className="mt-3 border border-stamp/40 p-3">
            <p className="text-[11px] text-stamp">Final confirmation — delete {targetEmail} now?</p>
            <div className="mt-2 flex gap-2">
              <button onClick={deleteAccount} disabled={!canDelete || busy === "delete"} className="flex h-8 items-center bg-stamp px-3 text-[11px] font-medium text-paper transition-colors hover:opacity-90 disabled:opacity-50">
                {busy === "delete" ? "Deleting…" : "Delete forever"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="flex h-8 items-center px-3 text-[11px] text-muted hover:text-ink">
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      {msg && <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{msg}</p>}
    </div>
  );
}
