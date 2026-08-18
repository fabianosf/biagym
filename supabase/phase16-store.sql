-- BiAGym – Produtos e cupons da Loja
-- Execute no Supabase SQL Editor após supabase/schema.sql

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  image_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_created_at_idx
  on public.products (created_at desc);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 1 and 100),
  description text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists coupons_created_at_idx
  on public.coupons (created_at desc);

alter table public.products enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "products_select" on public.products;
create policy "products_select"
on public.products for select
to authenticated
using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "coupons_select" on public.coupons;
create policy "coupons_select"
on public.coupons for select
to authenticated
using (true);

drop policy if exists "coupons_admin_write" on public.coupons;
create policy "coupons_admin_write"
on public.coupons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage das fotos de produto (bucket público, só admin escreve)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write"
on storage.objects for all
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects for select
to public
using (bucket_id = 'product-images');
