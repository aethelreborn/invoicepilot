"use client";

import { useCallback, useEffect, useState } from "react";
import { buildUpiUri } from "@/lib/payments";

export type PublicPaymentInfo = {
  provider: string;
  upi_vpa: string | null;
  upi_name: string | null;
  bank_details: string | null;
  has_checkout: boolean;
};

type CheckoutResponse = {
  checkout: {
    kind: "qr" | "redirect" | "razorpay" | "manual" | "unavailable";
    uri?: string;
    url?: string;
    keyId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    businessName?: string;
    description?: string;
    prefillEmail?: string;
    reason?: string;
  };
  payment_id?: string | null;
};

type StatusResponse = {
  status: string;
  paid_at?: string | null;
  payment?: { status: string; verification: string; verification_level: number | null; utr: string | null; paid_at: string | null } | null;
};

type RazorpayModal = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayModal;
  }
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

export default function PayActions({
  token,
  status,
  payment,
  amountCents,
  currency,
}: {
  token: string;
  status: string;
  payment: PublicPaymentInfo | null;
  amountCents: number;
  currency: string;
}) {
  const [phase, setPhase] = useState<"idle" | "redirecting" | "polling">("idle");
  const [claimed, setClaimed] = useState(status === "claimed");
  const [paid, setPaid] = useState(status === "paid");
  const [failed, setFailed] = useState(false);

  const pollOnce = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/pay/${token}/status`);
      const data = (await res.json()) as StatusResponse;
      if (data.status === "paid") {
        setPaid(true);
        return true;
      }
      if (data.status === "failed") {
        setFailed(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (phase !== "polling") return;

    const tick = async () => {
      const finished = await pollOnce();
      if (finished) setPhase("idle");
    };

    void tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    const timeoutId = setTimeout(() => {
      clearInterval(interval);
      setPhase("idle");
    }, POLL_TIMEOUT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [phase, pollOnce]);

  const startRedirect = async () => {
    setPhase("redirecting");
    const res = await fetch(`/api/pay/${token}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const data = (await res.json()) as CheckoutResponse;
    if (res.ok && data.checkout.kind === "redirect" && data.checkout.url) {
      window.location.assign(data.checkout.url);
      return;
    }
    setPhase("idle");
  };

  const startRazorpay = async () => {
    setPhase("redirecting");
    const res = await fetch(`/api/pay/${token}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "razorpay" }),
    });
    const data = (await res.json()) as CheckoutResponse;
    setPhase("idle");
    if (!res.ok || data.checkout.kind !== "razorpay") return;
    const { keyId, orderId, amount, currency, prefillEmail } = data.checkout;
    if (!keyId || !orderId) return;

    await new Promise<void>((resolve) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
      setTimeout(resolve, 8000);
    });

    if (!window.Razorpay) return;

    new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: orderId,
      prefill: prefillEmail ? { email: prefillEmail } : undefined,
      description: "Invoice payment",
      handler: () => setPhase("polling"),
      modal: {
        ondismiss: () => setPhase("idle"),
      },
    }).open();
  };

  const claim = async (note?: string) => {
    setPhase("polling");
    const res = await fetch(`/api/pay/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: payment?.provider || "upi", note }),
    });
    if (res.ok) {
      setClaimed(true);
      setPhase("polling");
    }
  };

  const provider = payment?.provider || "upi";
  const qrUri = provider === "upi" && payment?.upi_vpa ? buildUpiUri({ vpa: payment.upi_vpa, name: payment.upi_name || null, amountCents, currency, note: "Invoice payment" }) : null;

  if (paid) {
    return (
      <div className="border border-accent/40 bg-accent/[0.06] px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Paid — settled in full</p>
        <p className="mt-1.5 text-[12px] text-ink-soft">This invoice is closed. No further action is needed.</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="border border-stamp/40 bg-stamp/[0.06] px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stamp">Payment failed</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">The payment could not be completed. Ask your bank or provider to try again.</p>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="border border-dashed border-ink/30 bg-card px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink">Payment claimed</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">Your provider has been notified and will confirm once the money clears.</p>
      </div>
    );
  }

  if (phase === "polling") {
    return (
      <div className="border border-rule bg-card px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Waiting for confirmation</p>
        <p className="mt-1.5 text-[12px] text-ink-soft">The sender has been notified. We are watching for the settled payment.</p>
      </div>
    );
  }

  return (
    <div>
      {provider === "upi" && (
        <div className="border border-rule bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[180px] text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/pay/${token}/qr.png`}
                alt={`UPI QR for invoice payment of ${amountCents} paise`}
                width={180}
                height={180}
                className="mx-auto block border border-rule bg-paper"
              />
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">Scan with any UPI app</p>
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">Amount due</p>
              <p className="mt-1 font-mono text-[1.5rem] tabular-nums text-ink">{amountCents / 100}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{currency}</p>
              {payment?.upi_vpa && (
                <a
                  href={qrUri || "#"}
                  className="mt-3 flex h-10 items-center justify-center bg-ink px-4 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
                >
                  Complete payment
                </a>
              )}
            </div>
          </div>
          <div className="mt-3 text-center">
            <a
              href={qrUri || "#"}
              className="text-[11px] text-ink-soft underline underline-offset-2"
              rel="noreferrer"
            >
              Open UPI app to complete payment
            </a>
          </div>
          {payment?.bank_details && (
            <div className="mt-4 border-t border-rule pt-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">If UPI does not arrive</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-soft">{payment.bank_details}</p>
            </div>
          )}
        </div>
      )}

      {provider === "razorpay" && (
        <button
          onClick={startRazorpay}
          disabled={phase === "redirecting"}
          className="flex h-12 w-full items-center justify-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {phase === "redirecting" ? "Opening checkout…" : "Complete payment"}
        </button>
      )}

      {(provider === "stripe" || provider === "youpi") && (
        <button
          onClick={startRedirect}
          disabled={phase === "redirecting"}
          className="flex h-12 w-full items-center justify-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {phase === "redirecting" ? "Opening secure checkout…" : "Complete payment"}
        </button>
      )}

      {provider === "custom" && (
        <div className="border border-dashed border-ink/30 bg-card px-4 py-3">
          <p className="text-[12px] leading-relaxed text-ink-soft">Send the payment to your bank and notify your client to claim it.</p>
          <button onClick={() => claim()} className="mt-3 flex h-10 w-full items-center justify-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft">
            I have paid this invoice
          </button>
        </div>
      )}

      {(provider === "upi" || provider === "custom") && (
        <button
          onClick={() => claim()}
          disabled={phase === "redirecting"}
          className="mt-3 flex h-10 w-full items-center justify-center border border-ink bg-card px-5 text-[12px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          {phase === "redirecting" ? "Notifying…" : "I have paid this invoice"}
        </button>
      )}

      <p className="mt-2.5 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-muted">
        Any payment is confirmed by the provider before this invoice closes. Claiming notifies your provider, it does not mark the invoice paid.
      </p>
    </div>
  );
}
