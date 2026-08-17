-- TreinosAtleta – Supabase Storage (Fase 7)
-- Execute no Supabase SQL Editor após supabase/schema.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-videos',
  'lesson-videos',
  true,
  524288000,
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lesson_videos_admin_insert" on storage.objects;
create policy "lesson_videos_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'lesson-videos'
  and public.is_admin()
);

drop policy if exists "lesson_videos_admin_update" on storage.objects;
create policy "lesson_videos_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'lesson-videos'
  and public.is_admin()
)
with check (
  bucket_id = 'lesson-videos'
  and public.is_admin()
);

drop policy if exists "lesson_videos_admin_delete" on storage.objects;
create policy "lesson_videos_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'lesson-videos'
  and public.is_admin()
);

drop policy if exists "lesson_videos_authenticated_read" on storage.objects;
create policy "lesson_videos_authenticated_read"
on storage.objects for select
to authenticated
using (bucket_id = 'lesson-videos');
