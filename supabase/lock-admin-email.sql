-- BiAGym – trava o admin no e-mail fabiano.freitas@gmail.com
-- Cole no SQL Editor e execute uma vez (já tem schema + fix-admin).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
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

create or replace function public.claim_coach_role()
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

  insert into public.coach_allowlist (email)
  values ('fabiano.freitas@gmail.com')
  on conflict (email) do nothing;

  return current_profile;
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.can_self_promote_to_admin() from public;
revoke all on function public.claim_coach_role() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_self_promote_to_admin() to authenticated;
grant execute on function public.claim_coach_role() to authenticated;

update public.profiles
set role = 'student'
where lower(email) <> 'fabiano.freitas@gmail.com'
  and role = 'admin';

update public.profiles
set role = 'admin'
where lower(email) = 'fabiano.freitas@gmail.com';

delete from public.coach_allowlist
where lower(email) <> 'fabiano.freitas@gmail.com';

insert into public.coach_allowlist (email)
values ('fabiano.freitas@gmail.com')
on conflict (email) do nothing;

notify pgrst, 'reload schema';
