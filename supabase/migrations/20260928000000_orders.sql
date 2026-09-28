begin;

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_first_name text not null,
  customer_last_name text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  currency text not null default 'NGN' check (currency = 'NGN'),
  subtotal_kobo bigint not null check (subtotal_kobo >= 0),
  shipping_kobo bigint not null default 0 check (shipping_kobo >= 0),
  tax_kobo bigint not null default 0 check (tax_kobo >= 0),
  total_kobo bigint not null check (total_kobo >= 0),
  shipping_address jsonb not null check (pg_catalog.jsonb_typeof(shipping_address) = 'object'),
  billing_address jsonb check (
    billing_address is null or pg_catalog.jsonb_typeof(billing_address) = 'object'
  ),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint orders_total_matches_components
    check (total_kobo = subtotal_kobo + shipping_kobo + tax_kobo)
);

create table public.order_items (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  variant_id text references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  image_url text,
  unit_price_kobo bigint not null check (unit_price_kobo >= 0),
  quantity integer not null check (quantity > 0),
  line_total_kobo bigint not null check (line_total_kobo >= 0),
  created_at timestamptz not null default pg_catalog.now(),
  constraint order_items_line_total_matches check (line_total_kobo = unit_price_kobo * quantity)
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index order_items_order_idx on public.order_items (order_id);

create trigger orders_set_updated_at before update on public.orders
  for each row execute function private.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.orders, public.order_items from public, anon, authenticated;
grant select on table public.orders, public.order_items to authenticated;
grant update (status, payment_status) on table public.orders to authenticated;

create policy orders_read_owner_or_admin on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy orders_update_admin on public.orders
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy order_items_read_owner_or_admin on public.order_items
  for select to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.orders as o
      where o.id = order_items.order_id and o.user_id = (select auth.uid())
    )
  );

-- Authenticated customers create orders only through this identity-bound RPC.
-- It re-reads active variants, calculates totals, and writes snapshots atomically.
create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_billing_address jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_customer_email text;
  v_subtotal bigint;
  v_order_id uuid;
  v_order_number text;
  v_item_count integer;
  v_matched_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select u.email into v_customer_email
  from auth.users as u
  where u.id = v_user_id;

  if v_customer_email is null then
    raise exception 'Authenticated user email is unavailable' using errcode = '22023';
  end if;

  if p_items is null or pg_catalog.jsonb_typeof(p_items) <> 'array'
    or pg_catalog.jsonb_array_length(p_items) < 1
    or pg_catalog.jsonb_array_length(p_items) > 50 then
    raise exception 'Order must contain between 1 and 50 items' using errcode = '22023';
  end if;

  if exists (
    select 1 from pg_catalog.jsonb_array_elements(p_items) as item(value)
    where pg_catalog.jsonb_typeof(item.value) <> 'object'
      or coalesce(item.value ->> 'variantId', '') = ''
      or coalesce(item.value ->> 'quantity', '') !~ '^[0-9]{1,3}$'
      or (item.value ->> 'quantity')::integer < 1
      or (item.value ->> 'quantity')::integer > 99
  ) then
    raise exception 'Order item is invalid' using errcode = '22023';
  end if;

  select pg_catalog.count(*)::integer,
         pg_catalog.count(distinct item.value ->> 'variantId')::integer
    into v_item_count, v_matched_count
  from pg_catalog.jsonb_array_elements(p_items) as item(value);

  if v_item_count <> v_matched_count then
    raise exception 'Duplicate variants are not allowed' using errcode = '22023';
  end if;

  if p_shipping_address is null or pg_catalog.jsonb_typeof(p_shipping_address) <> 'object'
    or exists (
      select 1 from (values ('firstName'), ('lastName'), ('line1'), ('city'), ('state'), ('postalCode'), ('country')) as required(field)
      where coalesce(pg_catalog.btrim(p_shipping_address ->> required.field), '') = ''
    ) then
    raise exception 'Shipping address is incomplete' using errcode = '22023';
  end if;

  if p_billing_address is not null and (
    pg_catalog.jsonb_typeof(p_billing_address) <> 'object'
    or exists (
      select 1 from (values ('firstName'), ('lastName'), ('line1'), ('city'), ('state'), ('postalCode'), ('country')) as required(field)
      where coalesce(pg_catalog.btrim(p_billing_address ->> required.field), '') = ''
    )
  ) then
    raise exception 'Billing address is incomplete' using errcode = '22023';
  end if;

  -- Keep variant prices and product status stable between calculation and insert.
  perform v.id
  from pg_catalog.jsonb_array_elements(p_items) as item(value)
  join public.product_variants as v on v.id = item.value ->> 'variantId'
  join public.products as p on p.id = v.product_id and p.status = 'active'
  for share of v, p;

  select pg_catalog.sum(v.price_kobo * (item.value ->> 'quantity')::integer)
    into v_subtotal
  from pg_catalog.jsonb_array_elements(p_items) as item(value)
  join public.product_variants as v on v.id = item.value ->> 'variantId'
  join public.products as p on p.id = v.product_id and p.status = 'active';

  select pg_catalog.count(*)::integer into v_matched_count
  from pg_catalog.jsonb_array_elements(p_items) as item(value)
  join public.product_variants as v on v.id = item.value ->> 'variantId'
  join public.products as p on p.id = v.product_id and p.status = 'active';

  if v_matched_count <> v_item_count then
    raise exception 'One or more variants are unavailable' using errcode = '22023';
  end if;

  -- Shipping stays at zero until a real delivery pricing rule is configured.
  -- Tax stays at zero until an authoritative tax rule is configured.
  v_order_number := 'RI-' || pg_catalog.to_char(pg_catalog.now(), 'YYYYMMDD') || '-'
    || pg_catalog.lpad(pg_catalog.nextval('public.order_number_seq')::text, 6, '0');

  insert into public.orders (
    order_number, user_id, customer_email, customer_first_name, customer_last_name,
    status, payment_status, currency, subtotal_kobo, shipping_kobo, tax_kobo,
    total_kobo, shipping_address, billing_address
  ) values (
    v_order_number, v_user_id, v_customer_email,
    pg_catalog.btrim(p_shipping_address ->> 'firstName'),
    pg_catalog.btrim(p_shipping_address ->> 'lastName'),
    'pending', 'pending', 'NGN', v_subtotal, 0, 0, v_subtotal,
    p_shipping_address, p_billing_address
  ) returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, variant_id, product_name, variant_name, sku,
    image_url, unit_price_kobo, quantity, line_total_kobo
  )
  select v_order_id, p.id, v.id, p.name, v.name, v.sku,
    (
      select pi.storage_path
      from public.product_images as pi
      where pi.product_id = p.id
      order by pi.sort_order asc, pi.id asc
      limit 1
    ),
    v.price_kobo,
    (item.value ->> 'quantity')::integer,
    v.price_kobo * (item.value ->> 'quantity')::integer
  from pg_catalog.jsonb_array_elements(p_items) as item(value)
  join public.product_variants as v on v.id = item.value ->> 'variantId'
  join public.products as p on p.id = v.product_id and p.status = 'active';

  return pg_catalog.jsonb_build_object('id', v_order_id, 'orderNumber', v_order_number);
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, jsonb) to authenticated;
revoke all on sequence public.order_number_seq from public, anon, authenticated;

comment on table public.orders is 'Customer orders; all monetary amounts are NGN kobo.';
comment on table public.order_items is 'Immutable catalog and price snapshots for historical orders.';
comment on column public.order_items.image_url is 'Snapshot of the product image Storage path at order creation.';

commit;
