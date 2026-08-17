-- BiAGym – correção definitiva do botão "Sou admin"
-- Cole este arquivo INTEIRO no SQL Editor do Supabase e execute uma vez.
-- É idempotente: pode rodar de novo sem estragar dados de alunos.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and p.role = 'admin'
      and lower(coalesce(u.email, p.email, '')) = 'fabiano.freitas@gmail.com'
  );
$$;

create table if not exists public.coach_allowlist (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.coach_allowlist enable row level security;

grant usage on schema public to authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.coach_allowlist to authenticated;

-- Quem já é admin pode gerenciar a allowlist.
drop policy if exists "coach_allowlist_admin_all" on public.coach_allowlist;
create policy "coach_allowlist_admin_all"
on public.coach_allowlist for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Bootstrap: primeiro admin (ou e-mail na allowlist) pode se promover
-- sem precisar da RPC. Depois do 1º admin, alunos comuns NÃO viram admin.
-- ---------------------------------------------------------------------------

create or replace function public.can_self_promote_to_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(coalesce(u.email, '')) = 'fabiano.freitas@gmail.com'
  );
$$;

revoke all on function public.can_self_promote_to_admin() from public;
grant execute on function public.can_self_promote_to_admin() to authenticated;

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_as_admin" on public.profiles;

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and (
    role = 'student'
    or public.is_admin()
    or public.can_self_promote_to_admin()
  )
);

create policy "profiles_update_as_admin"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- RPC oficial: cria o perfil se faltar e promove com SECURITY DEFINER
-- (ignora RLS). Primeiro usuário vira admin; os próximos precisam
-- estar em coach_allowlist.
-- ---------------------------------------------------------------------------

drop function if exists public.claim_coach_role();

create function public.claim_coach_role()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_profile public.profiles;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select u.email into current_email
  from auth.users u
  where u.id = auth.uid();

  if lower(coalesce(current_email, '')) <> 'fabiano.freitas@gmail.com' then
    raise exception 'admin_email_forbidden';
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

notify pgrst, 'reload schema';
