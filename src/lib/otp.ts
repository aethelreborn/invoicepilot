const OTP_TTL_SECONDS = 10 * 60;

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
}

export function otpExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

export async function generateOtpCode(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const value =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(value % 1_000_000).padStart(6, "0");
}

export async function hashOtp(code: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
