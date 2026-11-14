import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.SECRETS_KEY = Buffer.from(new Uint8Array(32).fill(7)).toString("base64");
});

import { encryptSecret, decryptSecret } from "../src/lib/crypto";
import { hmacHex, verifyHmacHex } from "../src/lib/payments/verify";
import { buildUpiUri } from "../src/lib/payments/upi";
import { formatMoney } from "../src/lib/currency";
import { renderReminder, renderTemplate } from "../src/lib/reminders";

describe("crypto", () => {
  it("round-trips a secret", async () => {
    const payload = await encryptSecret("hunter2-secret");
    expect(payload.startsWith("v1.")).toBe(true);
    expect(await decryptSecret(payload)).toBe("hunter2-secret");
  });

  it("returns null on tampered payload", async () => {
    const payload = await encryptSecret("x");
    const tampered = payload.slice(0, -4) + "AAAA";
    expect(await decryptSecret(tampered)).toBeNull();
  });
});

describe("hmac", () => {
  it("verifies a valid signature", async () => {
    const sig = await hmacHex("secret", "body");
    expect(await verifyHmacHex("secret", "body", sig)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const sig = await hmacHex("secret", "body");
    expect(await verifyHmacHex("secret", "tampered", sig)).toBe(false);
  });

  it("rejects a wrong secret", async () => {
    const sig = await hmacHex("secret", "body");
    expect(await verifyHmacHex("other", "body", sig)).toBe(false);
  });
});

describe("upi", () => {
  it("builds a UPI URI for INR", () => {
    const uri = buildUpiUri({
      vpa: "a@bank",
      name: "Studio",
      amountCents: 120000,
      currency: "INR",
      note: "Invoice INV-1",
    });
    expect(uri).toContain("upi://pay?");
    expect(uri).toContain("pa=a%40bank");
    expect(uri).toContain("am=1200.00");
  });

  it("returns null for non-INR", () => {
    const uri = buildUpiUri({
      vpa: "a@bank",
      name: "Studio",
      amountCents: 100,
      currency: "USD",
      note: "x",
    });
    expect(uri).toBeNull();
  });
});

describe("money", () => {
  it("formats INR with en-IN grouping", () => {
    const out = formatMoney(123456, "INR");
    expect(out).toContain("1,234.56");
  });
});

describe("reminders", () => {
  it("renders template vars", () => {
    const out = renderTemplate("Hi {{client_name}} — {{amount}}", {
      client_name: "Harbor",
      invoice_number: "INV-1",
      amount: "₹100.00",
      due_date: "3 Nov",
      business_name: "Studio",
      pay_url: "https://x",
    });
    expect(out).toBe("Hi Harbor — ₹100.00");
  });

  it("renderReminder keeps subject and body", () => {
    const r = renderReminder(
      { subject: "Invoice {{invoice_number}}", body: "Pay {{amount}}" },
      {
        client_name: "c",
        invoice_number: "INV-2",
        amount: "₹50.00",
        due_date: "d",
        business_name: "b",
        pay_url: "u",
      }
    );
    expect(r.subject).toBe("Invoice INV-2");
    expect(r.body).toBe("Pay ₹50.00");
  });
});
