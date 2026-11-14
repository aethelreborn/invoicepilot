import { createAdminSupabase } from "@/lib/supabase/admin";
import type { ProviderEvent, ProviderId } from "./types";

export type SettleOutcome =
  | "ok"
  | "already_paid"
  | "not_found"
  | "amount_mismatch"
  | "closed";

export async function settleProviderEvent(
  provider: ProviderId,
  event: ProviderEvent
): Promise<SettleOutcome> {
  const admin = createAdminSupabase();

  const { data, error } = await admin.rpc("settle_payment", {
    p_provider: provider,
    p_provider_payment_id: event.providerPaymentId,
    p_provider_order_id: event.providerOrderId,
    p_amount_cents: event.amountCents,
    p_currency: event.currency,
    p_utr: event.utr,
    p_verification: "webhook",
    p_verification_level: event.verificationLevel,
    p_event: event.raw,
  });

  if (error) {
    throw new Error(`Could not settle payment: ${error.message}`);
  }

  return (data as SettleOutcome) || "not_found";
}
