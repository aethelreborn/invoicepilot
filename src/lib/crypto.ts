// AES-256-GCM for provider credentials stored in Postgres.
// Web Crypto only: the same code runs on Node and on Cloudflare Workers.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(): Promise<CryptoKey> {
  const raw = process.env.SECRETS_KEY;
  if (!raw) {
    throw new Error("SECRETS_KEY is not set. Generate one with: openssl rand -base64 32");
  }

  const keyBytes = base64ToBytes(raw.trim());
  if (keyBytes.length !== 32) {
    throw new Error("SECRETS_KEY must be 32 bytes encoded as base64.");
  }

  const keyBuffer = new Uint8Array(keyBytes);
  return crypto.subtle.importKey("raw", keyBuffer, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plain: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new Uint8Array(encoder.encode(plain))
  );

  const ciphertextBytes = new Uint8Array(ciphertext);
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(ciphertextBytes)}`;
}

export async function decryptSecret(payload: string | null): Promise<string | null> {
  if (!payload) return null;

  const parts = payload.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  try {
    const key = await importKey();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(parts[1]) },
      key,
      new Uint8Array(base64ToBytes(parts[2]))
    );
    return decoder.decode(plaintext);
  } catch {
    return null;
  }
}

export function secretsConfigured() {
  return Boolean(process.env.SECRETS_KEY);
}
