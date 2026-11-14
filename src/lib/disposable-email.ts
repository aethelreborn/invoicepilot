import { isDemoMode } from "@/lib/demo";
import { createAdminSupabase } from "@/lib/supabase/admin";

// Kept in sync with the seed in 0003_payments.sql. The database is the runtime
// source of truth; this set lets the check work before any query and in demo mode.
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "10minutemail.net", "20minutemail.com", "33mail.com",
  "anonbox.net", "burnermail.io", "discard.email", "dispostable.com",
  "dropmail.me", "emailondeck.com", "fakeinbox.com", "fakemail.net",
  "getairmail.com", "getnada.com", "guerrillamail.biz", "guerrillamail.com",
  "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "harakirimail.com",
  "inboxkitten.com", "jetable.org", "mail-temp.com", "mail.tm",
  "mailcatch.com", "maildrop.cc", "mailinator.com", "mailnesia.com",
  "mailsac.com", "mintemail.com", "mohmal.com", "moakt.com",
  "mytemp.email", "sharklasers.com", "spam4.me", "spamgourmet.com",
  "temp-mail.io", "temp-mail.org", "tempail.com", "tempinbox.com",
  "tempmail.com", "tempmail.dev", "tempmail.net", "tempmailo.com",
  "tempr.email", "throwawaymail.com", "trashmail.com", "trashmail.de",
  "yopmail.com", "yopmail.fr", "yopmail.net", "disposablemail.com",
  "emailfake.com", "generator.email", "mailtemp.net", "mvrht.net",
  "nada.email", "tempmailaddress.com", "tmpmail.net", "tmpmail.org",
]);

export function emailDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at === -1) return "";
  return email.slice(at + 1).trim().toLowerCase().replace(/\.$/, "");
}

export async function isDisposableEmail(email: string): Promise<boolean> {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;

  if (isDemoMode()) return false;

  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("blocked_email_domains")
      .select("domain")
      .eq("domain", domain)
      .maybeSingle();

    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * Cloudflare DNS-over-HTTPS MX lookup. Catches addresses on domains that do not
 * exist at all. Returns true when the lookup itself fails, so a DNS outage does
 * not stop real signups.
 */
export async function domainHasMx(domain: string): Promise<boolean> {
  if (!domain) return false;

  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) return true;

    const payload = (await response.json()) as {
      Status?: number;
      Answer?: { type: number }[];
    };

    if (payload.Status !== 0) return false;
    return (payload.Answer || []).some((answer) => answer.type === 15);
  } catch {
    return true;
  }
}

export async function checkEmailAddress(email: string): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  const domain = emailDomain(email);

  if (!domain || !domain.includes(".")) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  if (await isDisposableEmail(email)) {
    return {
      ok: false,
      reason: "Use a permanent email address. Disposable inboxes are not accepted.",
    };
  }

  if (!(await domainHasMx(domain))) {
    return { ok: false, reason: "That email domain does not accept mail." };
  }

  return { ok: true };
}
