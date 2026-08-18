-- BiAGym – Storage das capas de programa (upload de imagem em vez de URL manual)
-- Execute no Supabase SQL Editor após supabase/schema.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'program-covers',
  'program-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "program_covers_admin_write" on storage.objects;
create policy "program_covers_admin_write"
on storage.objects for all
to authenticated
using (bucket_id = 'program-covers' and public.is_admin())
with check (bucket_id = 'program-covers' and public.is_admin());

drop policy if exists "program_covers_public_read" on storage.objects;
create policy "program_covers_public_read"
on storage.objects for select
to public
using (bucket_id = 'program-covers');
