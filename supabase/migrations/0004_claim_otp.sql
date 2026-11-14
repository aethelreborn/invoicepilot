-- One-time codes for the public "I have paid" claim.
--
-- Only set when the invoice has a client email AND the freelancer has their
-- own Resend key configured; otherwise claiming stays one click. The code is
-- stored as a SHA-256 hash and expires in 10 minutes.

alter table public.invoices
  add column if not exists claim_otp_hash text,
  add column if not exists claim_otp_expires_at timestamptz;
