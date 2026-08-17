-- TreinosAtleta – dados de exemplo para testes locais
-- Execute APÓS supabase/schema.sql e supabase/storage.sql
--
-- Para vídeos reais da pasta /videos, rode também:
--   npm run seed:demo
-- (requer SUPABASE_SERVICE_ROLE_KEY no .env)

-- Categorias
insert into public.categories (name, slug, description)
values
  ('Força', 'forca', 'Treinos de força e hipertrofia'),
  ('Condicionamento', 'condicionamento', 'Treinos metabólicos e cardio')
on conflict (slug) do nothing;

-- Programa publicado
insert into public.programs (
  title,
  slug,
  description,
  cover_url,
  trainer_name,
  level,
  duration_weeks,
  is_published
)
values (
  'Programa Iniciante',
  'programa-iniciante',
  'Programa introdutório de 4 semanas com aulas em vídeo.',
  'https://placehold.co/800x450',
  'Coach TreinosAtleta',
  'iniciante',
  4,
  true
)
on conflict (slug) do nothing;

insert into public.program_categories (program_id, category_id)
select p.id, c.id
from public.programs p
cross join public.categories c
where p.slug = 'programa-iniciante'
  and c.slug in ('forca', 'condicionamento')
on conflict do nothing;

-- Semanas 1 a 4
insert into public.weeks (program_id, week_number, title)
select p.id, gs.week_number, 'Semana ' || gs.week_number
from public.programs p
cross join generate_series(1, 4) as gs(week_number)
where p.slug = 'programa-iniciante'
on conflict (program_id, week_number) do nothing;

-- Aulas placeholder (substituídas por npm run seed:demo quando possível)
insert into public.lessons (
  program_id,
  week_id,
  title,
  description,
  video_url,
  duration_seconds,
  sort_order,
  is_free_preview
)
select
  p.id,
  w.id,
  'Aula 1 – Boas-vindas',
  'Introdução ao programa.',
  'pending-upload',
  600,
  1,
  true
from public.programs p
join public.weeks w on w.program_id = p.id and w.week_number = 1
where p.slug = 'programa-iniciante'
on conflict (week_id, sort_order) do nothing;

insert into public.lessons (
  program_id,
  week_id,
  title,
  description,
  video_url,
  duration_seconds,
  sort_order,
  is_free_preview
)
select
  p.id,
  w.id,
  'Aula 2 – Técnica básica',
  'Conteúdo completo para alunos com acesso.',
  'pending-upload',
  900,
  2,
  false
from public.programs p
join public.weeks w on w.program_id = p.id and w.week_number = 1
where p.slug = 'programa-iniciante'
on conflict (week_id, sort_order) do nothing;

-- Liberar acesso (substitua os UUIDs após criar contas)
-- insert into public.access_grants (user_id, program_id, granted_by)
-- select
--   'STUDENT_USER_ID'::uuid,
--   p.id,
--   'ADMIN_USER_ID'::uuid
-- from public.programs p
-- where p.slug = 'programa-iniciante'
-- on conflict do nothing;
