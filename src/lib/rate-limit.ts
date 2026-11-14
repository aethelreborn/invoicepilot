import { isDemoMode } from "@/lib/demo";
import { createAdminSupabase } from "@/lib/supabase/admin";

type Bucket = { start: number; count: number };

// Demo mode has no database, so limits live in module memory for the life of the
// process. Production uses the Postgres counter, which holds across instances.
const demoBuckets = new Map<string, Bucket>();

export function requestIp(headers: Headers): string {
  // Cloudflare sets cf-connecting-ip and strips a client-supplied one.
  const cloudflare = headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SECRETS_KEY || "invoicepilot";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function demoRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const bucket = demoBuckets.get(key);

  if (!bucket || now - bucket.start > windowSeconds * 1000) {
    demoBuckets.set(key, { start: now, count: 1 });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

/**
 * Returns true when the request is allowed. Fails open on infrastructure errors:
 * a database outage must not lock every user out of the product, and every caller
 * still authenticates the request independently.
 */
export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `${scope}:${identifier}`;

  if (isDemoMode()) {
    return demoRateLimit(key, limit, windowSeconds);
  }

  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("rate limit check failed", error.message);
      return true;
    }

    return data === true;
  } catch (error) {
    console.error("rate limit check failed", (error as Error).message);
    return true;
  }
}

export async function rateLimitByIp(
  scope: string,
  headers: Headers,
  limit: number,
  windowSeconds: number
) {
  const ipHash = await hashIp(requestIp(headers));
  return rateLimit(scope, ipHash, limit, windowSeconds);
}
