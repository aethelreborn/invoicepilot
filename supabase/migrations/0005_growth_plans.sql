-- Growth tier, annual billing, onboarding stamp, money-row preservation.

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'starter', 'growth'));

alter table public.platform_payments drop constraint if exists platform_payments_plan_check;
alter table public.platform_payments
  add constraint platform_payments_plan_check check (plan in ('starter', 'growth'));
alter table public.platform_payments
  add column if not exists interval text not null default 'monthly'
  check (interval in ('monthly', 'annual'));

alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

-- Deleting an account must not erase the subscription payment audit trail.
-- Keep the rows, unlink them from the deleted user.
alter table public.platform_payments alter column user_id drop not null;
alter table public.platform_payments drop constraint if exists platform_payments_user_id_fkey;
alter table public.platform_payments
  add constraint platform_payments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
