import { createClient } from "@supabase/supabase-js";

// Service-role client. Server-only: importing this from a client component would
// leak the key into the bundle, so keep it behind route handlers and server code.
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || key.length < 20) {
    throw new Error("Supabase service role credentials are not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
