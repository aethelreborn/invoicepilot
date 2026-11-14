import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "InvoicePilot — Get paid without the awkward part",
    template: "%s | InvoicePilot",
  },
  description:
    "InvoicePilot follows up on unpaid invoices for freelancers: a heads-up before the due date, firmer notes after it, and a final notice at day fourteen. The sequence stops when the invoice is paid.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://invoicepilot.app"),
  openGraph: {
    title: "InvoicePilot — Get paid without the awkward part",
    description:
      "Automated invoice follow-ups for freelancers. Flat monthly price, no transaction fees.",
    type: "website",
    siteName: "InvoicePilot",
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  applicationName: "InvoicePilot",
  appleWebApp: {
    capable: true,
    title: "InvoicePilot",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
