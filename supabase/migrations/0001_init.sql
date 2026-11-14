-- InvoicePilot schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text,
  business_email text,
  logo_url text,
  currency text not null default 'USD',
  reminder_tone text not null default 'friendly' check (reminder_tone in ('friendly','firm','final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, business_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'business_name', null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  company text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_user_id_idx on public.clients(user_id);
alter table public.clients enable row level security;
create policy "clients_all_own" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_email text,
  number text not null,
  title text,
  status text not null default 'draft' check (status in ('draft','sent','viewed','claimed','paid','overdue','void')),
  issue_date date not null default current_date,
  due_date date not null,
  currency text not null default 'USD',
  subtotal_cents bigint not null default 0,
  tax_cents bigint not null default 0,
  total_cents bigint not null default 0,
  notes text,
  pay_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  reminder_count int not null default 0,
  last_reminder_at timestamptz,
  paid_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_due_date_idx on public.invoices(due_date);
create index if not exists invoices_pay_token_idx on public.invoices(pay_token);
alter table public.invoices enable row level security;
create policy "invoices_all_own" on public.invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- public read of invoice by pay_token (for pay page) — anon can read minimal fields
create policy "invoices_public_read_by_token" on public.invoices for select using (true);

-- line items
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price_cents bigint not null default 0,
  sort_order int not null default 0
);
create index if not exists line_items_invoice_id_idx on public.invoice_line_items(invoice_id);
alter table public.invoice_line_items enable row level security;
create policy "line_items_owner" on public.invoice_line_items for all
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
create policy "line_items_public_read" on public.invoice_line_items for select using (true);

-- reminder logs
create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tone text not null check (tone in ('friendly','firm','final')),
  channel text not null check (channel in ('email','manual')),
  to_email text,
  subject text,
  body text,
  sent_at timestamptz not null default now()
);
create index if not exists reminder_logs_invoice_id_idx on public.reminder_logs(invoice_id);
alter table public.reminder_logs enable row level security;
create policy "reminder_logs_owner" on public.reminder_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();