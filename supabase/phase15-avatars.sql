-- BiAGym – Storage de fotos de perfil (avatares)
-- Execute no Supabase SQL Editor após supabase/schema.sql
--
-- Bucket público: diferente das fotos de evolução física (body-progress,
-- privado), o avatar é pensado para ser visível — aparece na lista de alunas
-- da treinadora e no próprio perfil. Cada usuária só pode escrever dentro da
-- própria pasta ({auth.uid()}/...), igual ao padrão do body-progress.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_insert_own_or_admin" on storage.objects;
create policy "avatars_insert_own_or_admin"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "avatars_update_own_or_admin" on storage.objects;
create policy "avatars_update_own_or_admin"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id = 'avatars'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "avatars_delete_own_or_admin" on storage.objects;
create policy "avatars_delete_own_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
to public
using (bucket_id = 'avatars');
