-- BiAGym – Privacidade dos buckets de Storage
-- Execute no SQL Editor do Supabase DEPOIS de publicar a versão do app que já
-- resolve vídeos/fotos por URL assinada (resolveLessonVideoPlayableUrl,
-- getBodyPhotoPlayableUrls). Rodar antes disso quebra a exibição de vídeos e
-- fotos para quem ainda estiver com a versão antiga do app instalada.
--
-- O que corrige: os buckets lesson-videos e body-progress estavam marcados
-- public = true, o que faz o Storage servir qualquer objeto por URL pública
-- direta SEM avaliar as políticas de RLS abaixo. Fotos de evolução física
-- ficavam acessíveis por qualquer pessoa com a URL (previsível:
-- {userId}/{timestamp}.ext). Este script:
--   1. Torna os dois buckets privados (public = false).
--   2. Restringe a leitura de fotos de evolução à própria dona da foto
--      (ou admin) — a política anterior liberava para qualquer usuária
--      autenticada, o que continuaria expondo fotos entre alunas mesmo
--      com o bucket privado.

begin;

update storage.buckets set public = false where id = 'lesson-videos';
update storage.buckets set public = false where id = 'body-progress';

-- lesson_videos_authenticated_read já era restrita a "to authenticated"
-- (não usava using(true)) — não precisa mudar, só passa a valer de fato
-- agora que o bucket deixa de ser público.

drop policy if exists "body_progress_authenticated_read" on storage.objects;
create policy "body_progress_read_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'body-progress'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

commit;
