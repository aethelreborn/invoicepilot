const LOCAL = "http://localhost:3000";

function clean(url: string) {
  return url.replace(/\/+$/, "");
}

// Canonical origin for links that leave the app. In production with nothing
// configured this returns "" so callers fail loudly instead of emailing a
// dead localhost link.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return clean(explicit);

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return process.env.NODE_ENV === "production" ? "" : LOCAL;
}

export function requestOrigin(request: Request): string {
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (!host) return siteUrl();
  const proto =
    headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function appOrigin(request: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return explicit ? clean(explicit) : requestOrigin(request);
}
