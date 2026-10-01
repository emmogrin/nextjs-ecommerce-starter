-- Customer enquiries submitted through the Contact form.
-- Public-write, admin-read/update only. Inspected via the Supabase dashboard
-- (no admin UI yet).

begin;

create table public.customer_enquiries (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  name text not null check (pg_catalog.length(pg_catalog.btrim(name)) between 1 and 200),
  email text not null check (pg_catalog.length(pg_catalog.btrim(email)) between 3 and 320),
  subject text not null check (pg_catalog.length(pg_catalog.btrim(subject)) between 1 and 300),
  message text not null check (pg_catalog.length(pg_catalog.btrim(message)) between 1 and 5000),
  order_number text check (order_number is null or pg_catalog.length(pg_catalog.btrim(order_number)) <= 100),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default pg_catalog.now()
);

alter table public.customer_enquiries enable row level security;

revoke all on table public.customer_enquiries from public, anon, authenticated;
grant insert on table public.customer_enquiries to anon, authenticated;
grant select, update on table public.customer_enquiries to authenticated;

create policy customer_enquiries_insert on public.customer_enquiries
  for insert to anon, authenticated
  with check (status = 'new');

create policy customer_enquiries_select_admin on public.customer_enquiries
  for select to authenticated
  using ((select private.is_admin()));

create policy customer_enquiries_update_admin on public.customer_enquiries
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

comment on table public.customer_enquiries is
  'Customer enquiries from the Contact form. Admin-readable only; inspect in the Supabase dashboard.';

commit;
