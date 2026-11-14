const encoder = new TextEncoder();

function hexToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  const clean = value.trim().toLowerCase();
  if (clean.length === 0 || clean.length % 2 !== 0 || /[^0-9a-f]/.test(clean)) return null;

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new Uint8Array(encoder.encode(payload)));
  const signatureBytes = new Uint8Array(signature);
  return Array.from(signatureBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time HMAC comparison. Web Crypto's verify does the comparison inside
 * the platform, so no byte-by-byte early exit leaks timing information.
 */
export async function verifyHmacHex(
  secret: string,
  payload: string,
  expectedHex: string
): Promise<boolean> {
  if (!secret || !expectedHex) return false;

  const expected = hexToBytes(expectedHex);
  if (!expected) return false;

  const key = await hmacKey(secret);
  const data = new Uint8Array(encoder.encode(payload));
  return crypto.subtle.verify("HMAC", key, expected, data);
}

export function withinReplayWindow(timestampSeconds: number, toleranceSeconds = 300) {
  if (!Number.isFinite(timestampSeconds)) return false;
  return Math.abs(Date.now() / 1000 - timestampSeconds) <= toleranceSeconds;
}
