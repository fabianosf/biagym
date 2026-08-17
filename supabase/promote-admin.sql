-- Promova sua conta de treinador(a).
-- Arquivo canônico: supabase/fix-admin.sql (execute aquele no SQL Editor).
-- Este arquivo permanece como atalho e também cria claim_coach_role().

create table if not exists public.coach_allowlist (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.claim_coach_role()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_profile public.profiles;
  current_email text;
  has_other_admin boolean;
  allowlisted boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select u.email into current_email
  from auth.users u
  where u.id = auth.uid();

  select exists (
    select 1
    from public.profiles p
    where p.role = 'admin'
      and p.id <> auth.uid()
  ) into has_other_admin;

  select exists (
    select 1
    from public.coach_allowlist a
    where lower(a.email) = lower(coalesce(current_email, ''))
  ) into allowlisted;

  if has_other_admin and not allowlisted then
    raise exception 'coach_not_allowlisted';
  end if;

  insert into public.profiles (id, name, email, role)
  select
    u.id,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(u.email, 'aluno'), '@', 1),
      'Aluno'
    ),
    coalesce(u.email, u.id::text || '@local'),
    'student'
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do nothing;

  update public.profiles
  set role = 'admin'
  where id = auth.uid()
  returning * into current_profile;

  if current_profile.id is null then
    raise exception 'profile_not_found';
  end if;

  if current_email is not null then
    insert into public.coach_allowlist (email)
    values (lower(current_email))
    on conflict (email) do nothing;
  end if;

  return current_profile;
end;
$$;

revoke all on function public.claim_coach_role() from public;
grant execute on function public.claim_coach_role() to authenticated;

-- Alternativa manual:
-- update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
-- insert into public.coach_allowlist (email) values ('seu-email@exemplo.com');

create unique index if not exists access_grants_user_program_unique_idx
  on public.access_grants (user_id, program_id);
