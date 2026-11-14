import { describe, it, expect } from "vitest";

import { generateOtpCode, hashOtp, otpExpired } from "../src/lib/otp";

describe("otp", () => {
  it("generates a 6-digit code", async () => {
    for (let i = 0; i < 20; i++) {
      const code = await generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("hashes stably", async () => {
    expect(await hashOtp("123456")).toBe(await hashOtp("123456"));
    expect(await hashOtp("123456")).not.toBe(await hashOtp("654321"));
    expect((await hashOtp("123456")).length).toBe(64);
  });

  it("expires correctly", () => {
    expect(otpExpired(new Date(Date.now() - 1000).toISOString())).toBe(true);
    expect(otpExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
    expect(otpExpired(null)).toBe(true);
  });
});
