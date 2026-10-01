-- Add customer delivery contact details to orders.
--   - notes: optional delivery instructions (plain text, up to 500 characters).
--   - phone: stays inside shipping_address JSONB (already supported by the
--     Address type, addressSchema, and mapAddress) — no new column.
-- Recreates create_order with a 4-argument signature (adds p_notes) because
-- PostgreSQL treats the new signature as a separate function.

begin;

alter table public.orders add column if not exists notes text
  check (notes is null or pg_catalog.length(notes) <= 500);

drop function if exists public.create_order(jsonb, jsonb, jsonb);

create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_billing_address jsonb default null,
  p_notes text default null
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
  v_notes text;
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
      select 1 from (values ('firstName'), ('lastName'), ('line1'), ('city'), ('state'), ('postalCode'), ('country'), ('phone')) as required(field)
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

  v_notes := nullif(pg_catalog.btrim(p_notes), '');

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
    total_kobo, shipping_address, billing_address, notes
  ) values (
    v_order_number, v_user_id, v_customer_email,
    pg_catalog.btrim(p_shipping_address ->> 'firstName'),
    pg_catalog.btrim(p_shipping_address ->> 'lastName'),
    'pending', 'pending', 'NGN', v_subtotal, 0, 0, v_subtotal,
    p_shipping_address, p_billing_address, v_notes
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

revoke all on function public.create_order(jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, jsonb, text) to authenticated;

comment on column public.orders.notes is
  'Optional customer delivery instructions, plain text, up to 500 characters.';

commit;
