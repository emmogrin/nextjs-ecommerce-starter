-- Replace unrelated starter-template brands on the temporary demo catalog.
-- Product image associations are updated without deleting Storage objects.

begin;

insert into public.brands (id, name, slug, description, is_active)
values (
  'brand-radiant-identity',
  'Radiant Identity',
  'radiant-identity',
  'Temporary storefront brand for demo catalog products awaiting real partner brands.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  is_active = excluded.is_active;

update public.products
set brand_id = 'brand-radiant-identity'
where brand_id in (
  'brand-1',
  'brand-2',
  'brand-3',
  'brand-4',
  'brand-5',
  'brand-6'
);

update public.brands
set is_active = false
where id in (
  'brand-1',
  'brand-2',
  'brand-3',
  'brand-4',
  'brand-5',
  'brand-6'
);

-- Remove only the cleanser's image associations; the Storage objects remain untouched.
delete from public.product_images
where product_id = 'prod-1';

insert into public.product_images (
  id,
  product_id,
  variant_id,
  storage_path,
  alt,
  width,
  height,
  sort_order
)
values (
  'img-prod-1-01',
  'prod-1',
  null,
  'demo-local/prod-1/1::/images/products/placeholder.svg',
  'Illustrative placeholder; product photo coming soon',
  800,
  800,
  0
);

commit;
