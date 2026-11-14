"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/form-styles";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (isDemoMode()) {
      const res = await fetch("/api/demo/login", { method: "POST" });
      setLoading(false);
      if (!res.ok) {
        setError("Demo login failed");
        return;
      }
      router.push(redirect);
      router.refresh();
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function magicLink() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setError("Check your email for a magic link.");
  }

  return (
    <div className="w-full max-w-[380px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Sign in</p>
      <h1 className="mt-4 font-display text-[clamp(2.1rem,4vw,2.75rem)] leading-[0.98] tracking-[-0.02em]">
        Welcome back.
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Sign in to see what is owed and what is already on its way.
      </p>

      {isDemoMode() && (
        <p className="mt-6 border-l-2 border-ink bg-paper-deep px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
          Demo mode. Any email and password will sign you in.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-[12px] text-stamp">{error}</p>}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {!isDemoMode() && (
          <button
            type="button"
            onClick={magicLink}
            disabled={loading || !email}
            className={secondaryButtonClass}
          >
            Send a magic link instead
          </button>
        )}
      </form>

      <p className="mt-7 border-t border-rule pt-5 text-[12px] text-muted">
        No account?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-4">
          Create one free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[380px] font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
