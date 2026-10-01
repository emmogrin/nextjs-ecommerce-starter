-- Radiant Identity blog CMS foundation.
-- The public storefront reads published articles; admins manage everything
-- through private.is_admin() (defined in the initial catalog migration).

begin;

create table public.blog_articles (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  title text not null check (pg_catalog.length(pg_catalog.btrim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '',
  body text not null default '',
  author text not null default '',
  category text,
  cover_image_storage_path text,
  cover_image_alt text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index blog_articles_status_idx on public.blog_articles (status);
create index blog_articles_published_idx
  on public.blog_articles (published_at desc)
  where status = 'published';

create trigger blog_articles_set_updated_at before update on public.blog_articles
  for each row execute function private.set_updated_at();

alter table public.blog_articles enable row level security;

revoke all on table public.blog_articles from public, anon, authenticated;
grant select on table public.blog_articles to anon, authenticated;
grant insert, update, delete on table public.blog_articles to authenticated;

create policy blog_articles_read_published_or_admin on public.blog_articles
  for select to anon, authenticated
  using (status = 'published' or (select private.is_admin()));

create policy blog_articles_insert_admin on public.blog_articles
  for insert to authenticated with check ((select private.is_admin()));

create policy blog_articles_update_admin on public.blog_articles
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy blog_articles_delete_admin on public.blog_articles
  for delete to authenticated using ((select private.is_admin()));

comment on table public.blog_articles is
  'Radiant Identity blog articles. body holds the HTML article content; category is a single optional tag.';
comment on column public.blog_articles.cover_image_storage_path is
  'Storage path in the product-images bucket (or a local demo path). Admins upload under the blog/ prefix.';

commit;
