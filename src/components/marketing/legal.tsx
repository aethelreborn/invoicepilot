export function Legal({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-6 py-14 md:px-10 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-[86px] lg:self-start">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-ink" aria-hidden="true" />
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              {eyebrow}
            </p>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {updated}
          </p>
        </div>

        <div>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[0.95] tracking-[-0.025em]">
            {title}
          </h1>
          <div className="mt-10 space-y-9">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Clause({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-rule pt-6 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-6">
      <p className="font-mono text-[10px] tabular-nums tracking-[0.1em] text-muted">{n}</p>
      <div>
        <h2 className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</h2>
        <div className="mt-2 space-y-3 text-[13px] leading-[1.7] text-muted">{children}</div>
      </div>
    </section>
  );
}
