"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/invoices/new", label: "New invoice" },
  { href: "/clients", label: "Clients" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export default function AppNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/invoices") {
      return pathname === "/invoices" || (pathname.startsWith("/invoices/") && pathname !== "/invoices/new");
    }
    return pathname === href;
  };

  return (
    <nav className="flex-1 px-4 py-5">
      <p className="hidden px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted md:block">
        Workspace
      </p>
      <ul className="mt-3 space-y-0.5">
        {nav.map((n) => (
          <li key={n.href}>
            <Link
              href={n.href}
              className={`flex items-center border-l-2 px-2.5 py-2 text-[13px] transition-colors ${
                isActive(n.href)
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:border-rule hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
