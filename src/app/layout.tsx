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
  keywords: [
    "invoice reminders",
    "invoice follow up software",
    "unpaid invoices",
    "late invoice reminders",
    "accounts receivable",
    "AR aging dashboard",
    "invoice payment tracking",
    "automated invoice reminders",
    "freelancer invoicing",
    "invoice collection",
    "client follow up",
    "invoice reminder automation",
  ],
  applicationName: "InvoicePilot",
  authors: [{ name: "InvoicePilot" }],
  creator: "InvoicePilot",
  publisher: "InvoicePilot",
  category: "business",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://invoicepilot.app"),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "RCwI_NxMEhfMKxhs_L-2LJsPXWR8nTEnSsNbRPLHIFw",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "InvoicePilot — Get paid without the awkward part",
    description:
      "Automated invoice follow-ups for freelancers. Flat monthly price, no transaction fees.",
    type: "website",
    siteName: "InvoicePilot",
    locale: "en_IN",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoicePilot — Get paid without the awkward part",
    description:
      "Automated invoice follow-ups for freelancers. Flat monthly price, no transaction fees.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "InvoicePilot",
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://invoicepilot.app",
                  description:
                    "Invoice follow-up and reminders for freelancers: a five-step sequence, an AR aging dashboard, public pay pages.",
                },
                {
                  "@type": "WebSite",
                  name: "InvoicePilot",
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://invoicepilot.app",
                },
                {
                  "@type": "SoftwareApplication",
                  name: "InvoicePilot",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  description:
                    "InvoicePilot sends the reminders you keep putting off and stops when the invoice is paid.",
                  offers: [
                    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "INR" },
                    {
                      "@type": "Offer",
                      name: "Starter",
                      price: "799",
                      priceCurrency: "INR",
                      description: "Unlimited invoices, automated reminder sequence.",
                    },
                  ],
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
