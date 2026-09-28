-- Initial Radiant Identity catalog schema.
-- Text IDs preserve the existing demo IDs during a future JSON import.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create table public.brands (
  id text primary key,
  name text not null check (pg_catalog.length(pg_catalog.btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  logo_storage_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.categories (
  id text primary key,
  parent_id text references public.categories(id) on delete restrict,
  name text not null check (pg_catalog.length(pg_catalog.btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  image_storage_path text,
  image_alt text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint categories_no_direct_self_parent check (parent_id is null or parent_id <> id)
);

create table public.products (
  id text primary key,
  brand_id text not null references public.brands(id) on delete restrict,
  name text not null check (pg_catalog.length(pg_catalog.btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  body text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  tags text[] not null default array[]::text[],
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  featured boolean not null default false,
  promoted boolean not null default false,
  promotion_priority integer not null default 0,
  promotion_starts_at timestamptz,
  promotion_ends_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint products_promotion_window_valid check (
    promotion_starts_at is null or promotion_ends_at is null
    or promotion_starts_at <= promotion_ends_at
  )
);

create table public.product_categories (
  product_id text not null references public.products(id) on delete cascade,
  category_id text not null references public.categories(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (product_id, category_id)
);

create table public.product_variants (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  sku text not null unique check (pg_catalog.length(pg_catalog.btrim(sku)) > 0),
  name text not null check (pg_catalog.length(pg_catalog.btrim(name)) > 0),
  options jsonb not null default '[]'::jsonb
    check (pg_catalog.jsonb_typeof(options) = 'array'),
  price_kobo bigint not null check (price_kobo >= 0),
  compare_at_price_kobo bigint check (
    compare_at_price_kobo is null or compare_at_price_kobo >= price_kobo
  ),
  quantity integer not null default 0 check (quantity >= 0),
  track_inventory boolean not null default true,
  allow_backorder boolean not null default false,
  weight numeric(10, 3) check (weight is null or weight >= 0),
  dimensions jsonb check (
    dimensions is null or pg_catalog.jsonb_typeof(dimensions) = 'object'
  ),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  unique (id, product_id)
);

create table public.product_images (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  variant_id text,
  storage_path text not null unique check (pg_catalog.length(pg_catalog.btrim(storage_path)) > 0),
  alt text not null default '',
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint product_images_variant_same_product_fk
    foreign key (variant_id, product_id)
    references public.product_variants(id, product_id) on delete cascade
);

create table public.product_links (
  id text primary key,
  product_id text not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('promotion', 'social', 'purchase')),
  label text not null check (pg_catalog.length(pg_catalog.btrim(label)) > 0),
  url text not null check (url ~* '^https?://'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint product_links_window_valid check (
    starts_at is null or ends_at is null or starts_at <= ends_at
  )
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

-- This pinned SECURITY DEFINER helper avoids recursive RLS checks. App users
-- receive no write grants on user_roles, so they cannot self-promote.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles as ur
    where ur.user_id = (select auth.uid()) and ur.role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create index categories_parent_sort_idx on public.categories (parent_id, sort_order);
create index categories_active_sort_idx on public.categories (sort_order, name) where is_active;
create index products_brand_id_idx on public.products (brand_id);
create index products_status_created_idx on public.products (status, created_at desc);
create index products_active_featured_idx
  on public.products (promotion_priority desc, created_at desc)
  where status = 'active' and featured;
create index products_active_promoted_idx
  on public.products (promotion_priority desc, promotion_starts_at, promotion_ends_at)
  where status = 'active' and promoted;
create index products_tags_idx on public.products using gin (tags);
create index product_categories_category_product_idx
  on public.product_categories (category_id, product_id);
create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_images_product_sort_idx on public.product_images (product_id, sort_order);
create index product_images_variant_sort_idx
  on public.product_images (variant_id, sort_order) where variant_id is not null;
create index product_links_product_kind_sort_idx
  on public.product_links (product_id, kind, sort_order) where is_active;
create index user_roles_role_idx on public.user_roles (role);

create trigger brands_set_updated_at before update on public.brands
  for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function private.set_updated_at();
create trigger product_images_set_updated_at before update on public.product_images
  for each row execute function private.set_updated_at();
create trigger product_links_set_updated_at before update on public.product_links
  for each row execute function private.set_updated_at();
create trigger user_roles_set_updated_at before update on public.user_roles
  for each row execute function private.set_updated_at();

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_links enable row level security;
alter table public.user_roles enable row level security;

revoke all on table
  public.brands, public.categories, public.products, public.product_categories,
  public.product_variants, public.product_images, public.product_links
from public, anon, authenticated;
grant select on table
  public.brands, public.categories, public.products, public.product_categories,
  public.product_variants, public.product_images, public.product_links
to anon, authenticated;
grant insert, update, delete on table
  public.brands, public.categories, public.products, public.product_categories,
  public.product_variants, public.product_images, public.product_links
to authenticated;
revoke all on table public.user_roles from public, anon, authenticated;
grant select on table public.user_roles to authenticated;

create policy brands_read_public_or_admin on public.brands
  for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy brands_insert_admin on public.brands
  for insert to authenticated with check ((select private.is_admin()));
create policy brands_update_admin on public.brands
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy brands_delete_admin on public.brands
  for delete to authenticated using ((select private.is_admin()));

create policy categories_read_public_or_admin on public.categories
  for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy categories_insert_admin on public.categories
  for insert to authenticated with check ((select private.is_admin()));
create policy categories_update_admin on public.categories
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy categories_delete_admin on public.categories
  for delete to authenticated using ((select private.is_admin()));

create policy products_read_public_or_admin on public.products
  for select to anon, authenticated
  using (status = 'active' or (select private.is_admin()));
create policy products_insert_admin on public.products
  for insert to authenticated with check ((select private.is_admin()));
create policy products_update_admin on public.products
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy products_delete_admin on public.products
  for delete to authenticated using ((select private.is_admin()));

create policy product_categories_read_public_or_admin on public.product_categories
  for select to anon, authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.products as p
      join public.categories as c on c.id = product_categories.category_id
      where p.id = product_categories.product_id
        and p.status = 'active' and c.is_active
    )
  );
create policy product_categories_insert_admin on public.product_categories
  for insert to authenticated with check ((select private.is_admin()));
create policy product_categories_update_admin on public.product_categories
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy product_categories_delete_admin on public.product_categories
  for delete to authenticated using ((select private.is_admin()));

create policy product_variants_read_public_or_admin on public.product_variants
  for select to anon, authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.products as p
      where p.id = product_variants.product_id and p.status = 'active'
    )
  );
create policy product_variants_insert_admin on public.product_variants
  for insert to authenticated with check ((select private.is_admin()));
create policy product_variants_update_admin on public.product_variants
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy product_variants_delete_admin on public.product_variants
  for delete to authenticated using ((select private.is_admin()));

create policy product_images_read_public_or_admin on public.product_images
  for select to anon, authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.products as p
      where p.id = product_images.product_id and p.status = 'active'
    )
  );
create policy product_images_insert_admin on public.product_images
  for insert to authenticated with check ((select private.is_admin()));
create policy product_images_update_admin on public.product_images
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy product_images_delete_admin on public.product_images
  for delete to authenticated using ((select private.is_admin()));

create policy product_links_read_public_or_admin on public.product_links
  for select to anon, authenticated
  using (
    (select private.is_admin()) or (
      is_active
      and (starts_at is null or starts_at <= pg_catalog.now())
      and (ends_at is null or ends_at > pg_catalog.now())
      and exists (
        select 1 from public.products as p
        where p.id = product_links.product_id and p.status = 'active'
      )
    )
  );
create policy product_links_insert_admin on public.product_links
  for insert to authenticated with check ((select private.is_admin()));
create policy product_links_update_admin on public.product_links
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy product_links_delete_admin on public.product_links
  for delete to authenticated using ((select private.is_admin()));

create policy user_roles_read_self_or_admin on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_storage_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_storage_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_storage_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_storage_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

comment on table public.products is
  'Radiant Identity catalog. Variant prices are stored as integer NGN kobo.';
comment on column public.product_variants.price_kobo is
  'Price in NGN kobo. This migration does not seed or convert any prices.';
comment on table public.product_images is
  'Image metadata and Storage paths; deleting a row does not delete its Storage object.';
