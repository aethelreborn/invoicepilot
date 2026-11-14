"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingCompleteButton({ allDone }: { allDone: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function complete() {
    setBusy(true);
    const res = await fetch("/api/onboarding/complete", { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">Setup marked complete.</p>;
  }

  return (
    <button
      onClick={complete}
      disabled={busy}
      className="flex h-9 items-center border border-ink px-4 text-[11px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
    >
      {busy ? "Saving…" : allDone ? "Mark as done" : "Dismiss setup guide"}
    </button>
  );
}
