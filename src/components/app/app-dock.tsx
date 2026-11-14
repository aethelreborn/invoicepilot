"use client";

import Dock from "@/components/originkit/ui/dock";
import { useRouter } from "next/navigation";

const ITEMS = [
  { label: "Home", icon: "home" as const },
  { label: "Invoices", icon: "folder" as const },
  { label: "Clients", icon: "user" as const },
  { label: "Billing", icon: "bookmark" as const },
  { label: "Settings", icon: "bell" as const },
];

const PATHS = ["/dashboard", "/invoices", "/clients", "/billing", "/settings"];

export default function AppDock() {
  const router = useRouter();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center md:hidden">
      <div className="pointer-events-auto rounded-full border border-rule bg-card/95 shadow-[0_8px_24px_rgba(22,21,15,0.12)] backdrop-blur">
        <Dock
          items={ITEMS}
          onChange={(index) => router.push(PATHS[index])}
          background="transparent"
          labels
          scale={56}
          magnify={1.3}
          spread={2.2}
          lift={9}
          font={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: "0.02em",
            lineHeight: "1em",
          }}
          colors={{
            bar: "transparent",
            border: "transparent",
            icon: "#5f5a4e",
            iconActive: "#16150f",
            dot: "#16150f",
            label: "#16150f",
            labelText: "#f3f0e8",
            shadow: "rgba(22,21,15,0.28)",
          }}
        />
      </div>
    </div>
  );
}
