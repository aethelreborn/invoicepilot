import Wordmark from "@/components/marketing/wordmark";
import HeroStack from "@/components/marketing/hero-stack";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-rule bg-paper-deep/40 p-10 lg:flex">
        <Wordmark />

        <div className="py-10">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-ink" aria-hidden="true" />
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Invoice follow-up
            </p>
          </div>
          <p className="mt-5 max-w-[20ch] font-display text-[clamp(2rem,3.2vw,2.75rem)] leading-[1] tracking-[-0.015em]">
            Get paid without the awkward part.
          </p>
          <div className="mt-4 max-w-[430px]">
            <HeroStack />
          </div>
        </div>

        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Free plan · 3 invoices · no card
        </p>
      </aside>

      <div className="flex min-h-screen flex-col px-6 py-8">
        <div className="lg:hidden">
          <Wordmark />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
    </div>
  );
}
