import Link from "next/link";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="22" height="22" rx="3" fill="currentColor" />
      <path
        d="M6.5 8.25h11M6.5 12h11M6.5 15.75h7"
        stroke="#f3f0e8"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 text-ink ${className}`}
      aria-label="InvoicePilot home"
    >
      <Mark className="h-[22px] w-[22px] transition-transform duration-200 group-hover:-translate-y-px" />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">InvoicePilot</span>
    </Link>
  );
}
