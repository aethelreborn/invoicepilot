import Link from "next/link";
import GooeyDeleteConfirm from "@/components/originkit/ui/gooey-delete-confirm";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper px-6 text-ink">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between py-6">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.01em]">
          InvoicePilot
        </Link>
        <Link
          href="/login"
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 items-center py-16">
        <div className="grid w-full gap-10 border-t border-rule pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Error 404
            </p>
            <h1 className="mt-5 max-w-[16ch] font-display text-[clamp(2.8rem,7vw,5rem)] leading-[0.92] tracking-[-0.03em]">
              This page is not in the ledger.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[14px] leading-relaxed text-muted">
              The address you followed does not exist, or the invoice behind it was deleted.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="flex h-10 items-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
              >
                Back to home
              </Link>
              <Link
                href="/dashboard"
                className="flex h-10 items-center border border-rule px-5 text-[12px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Go to dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 border border-rule bg-card p-6">
            <div className="w-full" style={{ height: 240 }}>
              <GooeyDeleteConfirm
                theme="light"
                background="#fbfaf6"
                accent="#a33c26"
                confirmText="Gone"
                cancelText="Not yet"
                size={100}
                style={{ minWidth: 0, minHeight: 0 }}
              />
            </div>
            <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
              A bit of theatre. Nothing is deleted.
            </p>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1180px] border-t border-rule py-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          InvoicePilot — invoice follow-up for freelancers
        </p>
      </footer>
    </div>
  );
}
