"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Me = { authenticated: boolean; email: string | null; name: string | null; plan: string };

const navLink = "text-[13px] text-muted transition-colors hover:text-ink focus-visible:text-ink";

function initialsOf(me: Me): string {
  const source = me.name || me.email || "?";
  const letters = source.replace(/[^a-zA-Z ]/g, " ").trim().split(/\s+/).filter(Boolean);
  const first = letters[0]?.[0] || "?";
  const second = letters.length > 1 ? letters[letters.length - 1]?.[0] : letters[0]?.[1] || "";
  return (first + second).toUpperCase();
}

export default function AuthCta() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((data) => { if (!cancelled) setMe(data as Me); })
      .catch(() => { if (!cancelled) setMe({ authenticated: false, email: null, name: null, plan: "free" }); });
    return () => { cancelled = true; };
  }, []);

  if (me?.authenticated) {
    const label = me.name || me.email || "Account";
    return (
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-ink font-mono text-[10px] font-medium text-paper"
          aria-hidden="true"
        >
          {initialsOf(me)}
        </span>
        <span className="hidden max-w-[18ch] truncate text-[13px] text-muted lg:inline" title={label}>
          {label}
        </span>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/login" className={navLink}>
        Sign in
      </Link>
      <Link
        href="/signup"
        className="inline-flex h-9 items-center bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
      >
        Start free
      </Link>
    </>
  );
}
