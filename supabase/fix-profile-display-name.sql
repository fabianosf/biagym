-- Preferência: nome completo do metadata, nunca o prefixo do e-mail.
-- Execute no SQL Editor se o cadastro ainda gravar "bruno.costa" em profiles.name.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      'Aluno'
    ),
    new.email,
    'student'
  )
  on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email
    where public.profiles.name is null
       or public.profiles.name = ''
       or public.profiles.name = split_part(coalesce(public.profiles.email, ''), '@', 1);

  return new;
end;
$$;

-- Corrige nomes já gravados como prefixo de e-mail quando o metadata tem nome real.
update public.profiles p
set name = coalesce(
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
  p.name
)
from auth.users u
where u.id = p.id
  and (
    p.name = split_part(coalesce(p.email, ''), '@', 1)
    or p.name ~ '^[A-Za-z0-9._%+-]+$' and (position('.' in p.name) > 0 or position('_' in p.name) > 0)
  )
  and coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), '')
  ) is not null
  and coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), '')
  ) not like '%@%'
  and position(' ' in coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), '')
  )) > 0;
