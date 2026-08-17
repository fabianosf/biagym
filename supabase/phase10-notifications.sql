-- BiAGym – Fase 10: notificações push
-- Execute no Supabase SQL Editor após supabase/schema.sql

alter table public.profiles
  add column if not exists push_notifications_enabled boolean not null default false;

alter table public.profiles
  add column if not exists expo_push_token text;

alter table public.profiles
  add column if not exists push_platform text
  check (push_platform is null or push_platform in ('ios', 'android', 'web'));

alter table public.profiles
  add column if not exists push_token_updated_at timestamptz;

create index if not exists profiles_push_enabled_idx
  on public.profiles (push_notifications_enabled)
  where push_notifications_enabled = true and expo_push_token is not null;

-- Usuários atualizam apenas os próprios campos de push (via policy existente de update own)
