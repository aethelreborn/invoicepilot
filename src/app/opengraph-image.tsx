import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "InvoicePilot — get paid without the awkward part";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const serif = readFileSync(join(process.cwd(), "src/app/fonts/InstrumentSerif-Regular.ttf"));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f0e8",
          color: "#16150f",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "#16150f",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 5,
                paddingLeft: 8,
              }}
            >
              <div style={{ width: 18, height: 2, background: "#f3f0e8" }} />
              <div style={{ width: 18, height: 2, background: "#f3f0e8" }} />
              <div style={{ width: 11, height: 2, background: "#f3f0e8" }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>InvoicePilot</div>
          </div>
          <div style={{ fontSize: 14, letterSpacing: 4, textTransform: "uppercase", color: "#5f5a4e" }}>
            Invoice follow-up
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
            <div style={{ fontSize: 15, letterSpacing: 5, textTransform: "uppercase", color: "#5f5a4e" }}>
              Accounts receivable, without the chasing
            </div>
            <div
              style={{
                marginTop: 22,
                fontFamily: "Instrument Serif",
                fontSize: 92,
                lineHeight: 0.94,
                letterSpacing: -1,
              }}
            >
              Get paid without the awkward part.
            </div>
            <div style={{ marginTop: 26, fontSize: 22, lineHeight: 1.4, color: "#5f5a4e" }}>
              A heads-up before the due date, firmer notes after it, a final notice at day
              fourteen. The sequence stops when the invoice is paid.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 300,
              border: "1px solid #d3cdbe",
              background: "#fbfaf6",
              padding: 22,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#5f5a4e" }}>
              <span>Invoice</span>
              <span style={{ color: "#a33c26" }}>Overdue</span>
            </div>
            <div style={{ marginTop: 12, fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>
              INV-2026-1001
            </div>
            <div style={{ marginTop: 4, fontSize: 15, color: "#5f5a4e" }}>Harbor & Pine</div>
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid #d3cdbe",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#5f5a4e" }}>
                Due
              </span>
              <span style={{ fontSize: 22, fontWeight: 600 }}>₹12,000.00</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #d3cdbe",
            paddingTop: 20,
            fontSize: 14,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#5f5a4e",
          }}
        >
          <span>Free plan — 3 invoices, no card</span>
          <span>invoicepilot.app</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
      ],
    }
  );
}
