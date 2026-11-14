"use client";

import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Freelancers" },
  { href: "/admin/payments", label: "Payments" },
];

export default function AdminNav() {
  return (
    <nav className="flex gap-5 border-b border-rule pb-5">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
