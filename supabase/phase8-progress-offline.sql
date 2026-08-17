-- TreinosAtleta – Fase 8: progresso avançado + offline
-- Execute no Supabase SQL Editor após supabase/schema.sql

alter table public.user_progress
  add column if not exists last_lesson_id uuid references public.lessons (id) on delete set null;

create index if not exists user_progress_last_lesson_id_idx
  on public.user_progress (last_lesson_id);
