-- Public pay page access, scoped to a single pay token.
--
-- The original schema granted `select using (true)` on invoices and line items so the
-- anonymous pay page could read a row. RLS cannot see the client's `where pay_token = ...`
-- filter, so that policy exposed every invoice to anyone holding the public anon key.
-- These functions replace it: the caller must know the 128-bit token, and only the row
-- matching that token is returned or updated.

drop policy if exists "invoices_public_read_by_token" on public.invoices;
drop policy if exists "line_items_public_read" on public.invoice_line_items;

create or replace function public.get_public_invoice(p_token text)
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
    'business_name', (
      select p.business_name from public.profiles p where p.id = i.user_id
    )
  )
  from public.invoices i
  where i.pay_token = p_token
  limit 1;
$$;

create or replace function public.mark_public_invoice_viewed(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.invoices
     set viewed_at = now(),
         status = 'viewed',
         updated_at = now()
   where pay_token = p_token
     and status = 'sent'
     and viewed_at is null;
$$;

create or replace function public.claim_public_invoice(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  select status into current_status
    from public.invoices
   where pay_token = p_token;

  if current_status is null then
    return 'not_found';
  end if;

  if current_status in ('claimed', 'paid') then
    return 'already';
  end if;

  if current_status not in ('sent', 'viewed', 'overdue') then
    return 'closed';
  end if;

  update public.invoices
     set status = 'claimed',
         viewed_at = coalesce(viewed_at, now()),
         updated_at = now()
   where pay_token = p_token
     and status in ('sent', 'viewed', 'overdue');

  return 'claimed';
end;
$$;

revoke all on function public.get_public_invoice(text) from public;
revoke all on function public.mark_public_invoice_viewed(text) from public;
revoke all on function public.claim_public_invoice(text) from public;

grant execute on function public.get_public_invoice(text) to anon, authenticated;
grant execute on function public.mark_public_invoice_viewed(text) to anon, authenticated;
grant execute on function public.claim_public_invoice(text) to anon, authenticated;
