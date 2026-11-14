"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/ui/form-styles";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
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
        setError("Demo signup failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const checkRes = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const checkData = await checkRes.json();
    if (!checkRes.ok || !checkData.ok) {
      setLoading(false);
      setError(checkData.reason || "This email address cannot be used.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[380px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        Create an account
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.1rem,4vw,2.75rem)] leading-[0.98] tracking-[-0.02em]">
        Start with three invoices.
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        No card. Add an invoice, set the sequence, and stop writing reminders yourself.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="business" className={labelClass}>
            Business name
          </label>
          <input
            id="business"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={fieldClass}
            placeholder="Fieldnote Studio"
            autoComplete="organization"
          />
        </div>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-[12px] text-stamp">{error}</p>}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-7 border-t border-rule pt-5 text-[12px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <p className="mt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-4">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
