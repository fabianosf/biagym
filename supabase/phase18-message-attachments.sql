-- BiAGym – Anexo de foto nos Recados (coach_messages)
-- Execute no Supabase SQL Editor após supabase/phase12-coaching.sql

alter table public.coach_messages
  add column if not exists attachment_url text;

-- ---------------------------------------------------------------------------
-- Storage dos anexos (bucket privado — só aluna e admin da conversa veem)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convenção de caminho: {studentUserId}/{timestamp}.ext — mesmo padrão do
-- bucket body-progress, o que permite restringir leitura/escrita pela pasta.

drop policy if exists "message_attachments_insert_own_or_admin" on storage.objects;
create policy "message_attachments_insert_own_or_admin"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'message-attachments'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "message_attachments_read_own_or_admin" on storage.objects;
create policy "message_attachments_read_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'message-attachments'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);
