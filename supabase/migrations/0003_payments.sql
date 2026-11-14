-- Payments, plans, admin roles, rate limits, audit trail.
--
-- Money model: the platform never holds invoice money. Each freelancer connects
-- their own payout account, and a payment is only marked settled by a signed
-- provider webhook or by the freelancer confirming a client claim.

-- ---------------------------------------------------------------------------
-- profiles: role, plan, locale, INR default
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists role text not null default 'user',
  add column if not exists plan text not null default 'free',
  add column if not exists plan_renews_at timestamptz,
  add column if not exists locale text not null default 'en-IN';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'starter'));

alter table public.profiles alter column currency set default 'INR';

-- Admins read everything through the service role; this helper exists so RLS
-- policies can express "admin" without recursing into profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- A user may edit their own profile, but never their own role or plan. Writes
-- made with the service role carry no auth.uid(), which is how admin actions and
-- payment webhooks are allowed to change these columns.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.plan is distinct from old.plan then
      raise exception 'profile_privilege_change_denied' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_profile_privileges() from public;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- payment_settings: one active provider per user
-- ---------------------------------------------------------------------------

create table if not exists public.payment_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'upi'
    check (provider in ('upi', 'razorpay', 'stripe', 'youpi', 'custom')),
  upi_vpa text,
  upi_name text,
  bank_details text,
  razorpay_key_id text,
  razorpay_key_secret_enc text,
  razorpay_webhook_secret_enc text,
  stripe_publishable_key text,
  stripe_secret_key_enc text,
  stripe_webhook_secret_enc text,
  youpi_base_url text,
  youpi_merchant_id text,
  youpi_webhook_secret_enc text,
  custom_webhook_secret_enc text,
  updated_at timestamptz not null default now()
);

alter table public.payment_settings enable row level security;
drop policy if exists payment_settings_select_own on public.payment_settings;
create policy payment_settings_select_own on public.payment_settings
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- payments: one row per attempt, never edited by the client
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  provider text not null check (provider in ('upi', 'razorpay', 'stripe', 'youpi', 'custom')),
  provider_order_id text,
  provider_payment_id text,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null,
  status text not null default 'created'
    check (status in ('created', 'pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded')),
  verification text not null default 'none'
    check (verification in ('none', 'client_claim', 'webhook', 'manual')),
  verification_level int,
  utr text,
  payer_note text,
  checkout_url text,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payments_user_id_idx on public.payments(user_id, created_at desc);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);
create index if not exists payments_status_idx on public.payments(status);
create unique index if not exists payments_provider_payment_uniq
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;
create unique index if not exists payments_provider_order_uniq
  on public.payments(provider, provider_order_id)
  where provider_order_id is not null;

alter table public.payments enable row level security;
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select using (auth.uid() = user_id);
drop policy if exists payments_select_admin on public.payments;
create policy payments_select_admin on public.payments
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- platform_payments: what the freelancer pays us, collected by UPI QR
-- ---------------------------------------------------------------------------

create table if not exists public.platform_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter')),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'INR',
  reference text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'paid', 'rejected')),
  utr text,
  note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists platform_payments_user_id_idx on public.platform_payments(user_id, created_at desc);
create index if not exists platform_payments_status_idx on public.platform_payments(status);

alter table public.platform_payments enable row level security;
drop policy if exists platform_payments_select_own on public.platform_payments;
create policy platform_payments_select_own on public.platform_payments
  for select using (auth.uid() = user_id);
drop policy if exists platform_payments_select_admin on public.platform_payments;
create policy platform_payments_select_admin on public.platform_payments
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- reminder_templates: per-user overrides, ours as the default
-- ---------------------------------------------------------------------------

create table if not exists public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tone text not null check (tone in ('friendly', 'firm', 'final')),
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, tone)
);

alter table public.reminder_templates enable row level security;
drop policy if exists reminder_templates_own on public.reminder_templates;
create policy reminder_templates_own on public.reminder_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- email_settings: bring your own Resend key
-- ---------------------------------------------------------------------------

create table if not exists public.email_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resend_api_key_enc text,
  from_name text,
  from_email text,
  reply_to text,
  updated_at timestamptz not null default now()
);

alter table public.email_settings enable row level security;
drop policy if exists email_settings_select_own on public.email_settings;
create policy email_settings_select_own on public.email_settings
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- rate_limits: shared across serverless instances
-- ---------------------------------------------------------------------------

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
begin
  insert into public.rate_limits as rl (key, window_start, count)
  values (left(p_key, 200), now(), 1)
  on conflict (key) do update
    set count = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning rl.count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- audit_log: admin actions and payment transitions
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log(created_at desc);
create index if not exists audit_log_target_idx on public.audit_log(target_type, target_id);

-- ---------------------------------------------------------------------------
-- blocked_email_domains: disposable inboxes seen at signup
-- ---------------------------------------------------------------------------

create table if not exists public.blocked_email_domains (
  domain text primary key,
  added_at timestamptz not null default now()
);

insert into public.blocked_email_domains (domain) values
  ('10minutemail.com'), ('10minutemail.net'), ('20minutemail.com'), ('33mail.com'),
  ('anonbox.net'), ('burnermail.io'), ('discard.email'), ('dispostable.com'),
  ('dropmail.me'), ('emailondeck.com'), ('fakeinbox.com'), ('fakemail.net'),
  ('getairmail.com'), ('getnada.com'), ('guerrillamail.biz'), ('guerrillamail.com'),
  ('guerrillamail.de'), ('guerrillamail.net'), ('guerrillamail.org'), ('harakirimail.com'),
  ('inboxkitten.com'), ('jetable.org'), ('mail-temp.com'), ('mail.tm'),
  ('mailcatch.com'), ('maildrop.cc'), ('mailinator.com'), ('mailnesia.com'),
  ('mailsac.com'), ('mintemail.com'), ('mohmal.com'), ('moakt.com'),
  ('mytemp.email'), ('sharklasers.com'), ('spam4.me'), ('spamgourmet.com'),
  ('temp-mail.io'), ('temp-mail.org'), ('tempail.com'), ('tempinbox.com'),
  ('tempmail.com'), ('tempmail.dev'), ('tempmail.net'), ('tempmailo.com'),
  ('tempr.email'), ('throwawaymail.com'), ('trashmail.com'), ('trashmail.de'),
  ('yopmail.com'), ('yopmail.fr'), ('yopmail.net'), ('disposablemail.com'),
  ('emailfake.com'), ('generator.email'), ('mailtemp.net'), ('mvrht.net'),
  ('nada.email'), ('tempmailaddress.com'), ('tmpmail.net'), ('tmpmail.org')
on conflict (domain) do nothing;

-- ---------------------------------------------------------------------------
-- settle_payment: the only path that marks an invoice paid from a provider event
-- ---------------------------------------------------------------------------

create or replace function public.settle_payment(
  p_provider text,
  p_provider_payment_id text,
  p_provider_order_id text,
  p_amount_cents bigint,
  p_currency text,
  p_utr text,
  p_verification text,
  p_verification_level int,
  p_event jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments%rowtype;
begin
  select * into pay
    from public.payments
   where provider = p_provider
     and (
       (p_provider_payment_id is not null and provider_payment_id = p_provider_payment_id)
       or (p_provider_order_id is not null and provider_order_id = p_provider_order_id)
     )
   order by created_at desc
   limit 1
   for update;

  if not found then
    return 'not_found';
  end if;

  if pay.status = 'paid' then
    return 'already_paid';
  end if;

  if pay.status = 'refunded' then
    return 'closed';
  end if;

  if p_amount_cents is null or p_amount_cents <> pay.amount_cents
     or (p_currency is not null and upper(p_currency) <> upper(pay.currency)) then
    update public.payments
       set status = 'failed',
           raw_event = coalesce(p_event, raw_event),
           updated_at = now()
     where id = pay.id;

    insert into public.audit_log (action, target_type, target_id, metadata)
    values (
      'payment.amount_mismatch',
      'payment',
      pay.id::text,
      jsonb_build_object(
        'provider', p_provider,
        'expected_cents', pay.amount_cents,
        'received_cents', p_amount_cents,
        'expected_currency', pay.currency,
        'received_currency', p_currency
      )
    );

    return 'amount_mismatch';
  end if;

  update public.payments
     set status = 'paid',
         verification = coalesce(p_verification, verification),
         verification_level = coalesce(p_verification_level, verification_level),
         utr = coalesce(p_utr, utr),
         provider_payment_id = coalesce(provider_payment_id, p_provider_payment_id),
         raw_event = coalesce(p_event, raw_event),
         paid_at = now(),
         updated_at = now()
   where id = pay.id;

  update public.invoices
     set status = 'paid',
         paid_at = coalesce(paid_at, now()),
         updated_at = now()
   where id = pay.invoice_id
     and status <> 'paid';

  insert into public.audit_log (action, target_type, target_id, metadata)
  values (
    'payment.settled',
    'payment',
    pay.id::text,
    jsonb_build_object(
      'provider', p_provider,
      'invoice_id', pay.invoice_id,
      'verification', p_verification,
      'verification_level', p_verification_level
    )
  );

  return 'ok';
end;
$$;

revoke all on function public.settle_payment(text, text, text, bigint, text, text, text, int, jsonb) from public;
grant execute on function public.settle_payment(text, text, text, bigint, text, text, text, int, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- public pay page: token-scoped reads and claims only
-- ---------------------------------------------------------------------------

drop function if exists public.get_public_invoice(text);

create function public.get_public_invoice(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'invoice', to_jsonb(i) - 'user_id' - 'client_id' - 'reminder_count' - 'last_reminder_at',
    'line_items', coalesce(
      (
        select jsonb_agg(to_jsonb(li) order by li.sort_order)
        from public.invoice_line_items li
        where li.invoice_id = i.id
      ),
      '[]'::jsonb
    ),
    'business_name', (select p.business_name from public.profiles p where p.id = i.user_id),
    'business_email', (select p.business_email from public.profiles p where p.id = i.user_id),
    'payment', jsonb_build_object(
      'provider', coalesce(ps.provider, 'upi'),
      'upi_vpa', ps.upi_vpa,
      'upi_name', ps.upi_name,
      'bank_details', ps.bank_details,
      'has_checkout', coalesce(ps.provider, 'upi') in ('razorpay', 'stripe', 'youpi')
    )
  )
  from public.invoices i
  left join public.payment_settings ps on ps.user_id = i.user_id
  where i.pay_token = p_token
  limit 1;
$$;

revoke all on function public.get_public_invoice(text) from public;
grant execute on function public.get_public_invoice(text) to anon, authenticated;

drop function if exists public.claim_public_invoice(text);

create function public.claim_public_invoice(
  p_token text,
  p_provider text default 'upi',
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  select id, user_id, status, total_cents, currency
    into inv
    from public.invoices
   where pay_token = p_token
   for update;

  if not found then
    return 'not_found';
  end if;

  if inv.status = 'paid' then
    return 'already';
  end if;

  if inv.status = 'claimed' then
    return 'already';
  end if;

  if inv.status in ('draft', 'void') then
    return 'closed';
  end if;

  update public.invoices
     set status = 'claimed',
         viewed_at = coalesce(viewed_at, now()),
         updated_at = now()
   where id = inv.id;

  insert into public.payments (
    user_id, invoice_id, provider, amount_cents, currency,
    status, verification, payer_note
  ) values (
    inv.user_id, inv.id, coalesce(p_provider, 'upi'), inv.total_cents, inv.currency,
    'pending', 'client_claim', nullif(p_note, '')
  );

  insert into public.audit_log (action, target_type, target_id, metadata)
  values (
    'payment.claimed',
    'invoice',
    inv.id::text,
    jsonb_build_object('provider', coalesce(p_provider, 'upi'))
  );

  return 'claimed';
end;
$$;

revoke all on function public.claim_public_invoice(text, text, text) from public;
grant execute on function public.claim_public_invoice(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- free plan: three invoices, enforced in the database
-- ---------------------------------------------------------------------------

create or replace function public.enforce_free_invoice_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text;
  used int;
begin
  -- Service-role writes (cron, webhooks, migrations) carry no user claim.
  if auth.uid() is null then
    return new;
  end if;

  select plan into current_plan from public.profiles where id = new.user_id;

  if current_plan is distinct from 'free' then
    return new;
  end if;

  select count(*) into used
    from public.invoices
   where user_id = new.user_id
     and status <> 'void';

  if used >= 3 then
    raise exception 'free_plan_invoice_limit'
      using errcode = 'P0001',
            hint = 'Upgrade to Starter to add more invoices.';
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_free_limit on public.invoices;
create trigger invoices_free_limit
  before insert on public.invoices
  for each row execute function public.enforce_free_invoice_limit();

-- ---------------------------------------------------------------------------
-- updated_at triggers for the new tables
-- ---------------------------------------------------------------------------

drop trigger if exists payment_settings_touch on public.payment_settings;
create trigger payment_settings_touch before update on public.payment_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

drop trigger if exists reminder_templates_touch on public.reminder_templates;
create trigger reminder_templates_touch before update on public.reminder_templates
  for each row execute function public.touch_updated_at();

drop trigger if exists email_settings_touch on public.email_settings;
create trigger email_settings_touch before update on public.email_settings
  for each row execute function public.touch_updated_at();
