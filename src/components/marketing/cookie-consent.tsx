"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "invoicepilot_consent";
const SERVER_SNAPSHOT = "__server__";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function CookieConsent() {
  const stored = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY),
    () => SERVER_SNAPSHOT
  );
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || stored !== null) return null;

  function choose(value: "accepted" | "declined") {
    localStorage.setItem(KEY, value);
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-paper"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-3 md:px-10">
        <p className="max-w-[62ch] text-[12px] leading-snug text-ink-soft">
          This site sets the sign-in cookie it needs to work. Nothing else — no ads, no
          cross-site tracking. See the{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-2 hover:text-ink-soft">
            privacy page
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => choose("declined")}
            className="flex h-9 items-center border border-rule px-4 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="flex h-9 items-center bg-ink px-4 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
