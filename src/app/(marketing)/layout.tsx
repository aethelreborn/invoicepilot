import Link from "next/link";
import Wordmark, { Mark } from "@/components/marketing/wordmark";
import AuthCta from "@/components/marketing/auth-cta";
import CookieConsent from "@/components/marketing/cookie-consent";

const navLink =
  "text-[13px] text-muted transition-colors hover:text-ink focus-visible:text-ink";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-xs focus:text-paper"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-rule bg-paper">
        <div className="mx-auto flex h-[62px] w-full max-w-[1200px] items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-9">
            <Wordmark />
            <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
              <Link href="/features" className={navLink}>
                Features
              </Link>
              <Link href="/pricing" className={navLink}>
                Pricing
              </Link>
              <Link href="/#sequence" className={navLink}>
                The sequence
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <AuthCta />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-rule bg-paper">
        <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-14 md:grid-cols-12">
            <div className="col-span-2 md:col-span-6">
              <div className="flex items-center gap-2.5">
                <Mark className="h-5 w-5 text-ink" />
                <span className="text-[15px] font-semibold tracking-[-0.01em]">InvoicePilot</span>
              </div>
              <p className="mt-4 max-w-[30ch] text-[13px] leading-relaxed text-muted">
                Follow-up software for people who send invoices and would rather not
                write the reminder themselves.
              </p>
            </div>

            <FooterColumn
              title="Product"
              links={[
                { href: "/features", label: "Features" },
                { href: "/pricing", label: "Pricing" },
                { href: "/#sequence", label: "The sequence" },
              ]}
            />
            <FooterColumn
              title="Account"
              links={[
                { href: "/login", label: "Sign in" },
                { href: "/signup", label: "Create an account" },
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2 border-t border-rule py-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} InvoicePilot. All rights reserved.</p>
            <p className="font-mono uppercase tracking-[0.14em]">
              Flat monthly price · 0% transaction fees
            </p>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="md:col-span-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[13px] text-ink-soft transition-colors hover:text-ink hover:underline hover:underline-offset-4"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
