-- BiAGym – WhatsApp no perfil do aluno
-- Execute no SQL Editor. Idempotente.

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is 'WhatsApp do aluno, só dígitos com DDI (ex.: 5511988888888)';
