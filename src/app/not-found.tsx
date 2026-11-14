import Link from "next/link";

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
        <div className="grid w-full gap-10 border-t border-rule pt-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-16">
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

          <dl className="border border-rule bg-card">
            <div className="flex items-baseline justify-between border-b border-rule px-4 py-3">
              <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                Status
              </dt>
              <dd className="font-mono text-[11px] tabular-nums text-ink">404</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-rule px-4 py-3">
              <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                Reason
              </dt>
              <dd className="text-[12px] text-ink-soft">No matching route</dd>
            </div>
            <div className="flex items-baseline justify-between px-4 py-3">
              <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
                Next step
              </dt>
              <dd className="text-[12px] text-ink-soft">Pick a link</dd>
            </div>
          </dl>
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
