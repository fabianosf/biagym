-- BiAGym – Schema completo
-- Execute no SQL Editor do Supabase. Idempotente.
-- Ordem: tabelas primeiro, funções depois (senão o Postgres reclama
-- que public.profiles não existe).

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table if not exists public.coach_allowlist (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  avatar_url text,
  phone text,
  push_notifications_enabled boolean not null default false,
  expo_push_token text,
  push_platform text check (push_platform is null or push_platform in ('ios', 'android', 'web')),
  push_token_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists phone text;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  cover_url text not null,
  trainer_name text not null,
  level text not null check (level in ('iniciante', 'intermediário', 'avançado')),
  duration_weeks integer not null check (duration_weeks > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.program_categories (
  program_id uuid not null references public.programs (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (program_id, category_id)
);

create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  week_number integer not null check (week_number > 0),
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (program_id, week_number)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  sort_order integer not null check (sort_order >= 0),
  is_free_preview boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (week_id, sort_order)
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  completed_lesson_ids uuid[] not null default '{}',
  percent_complete integer not null default 0 check (percent_complete between 0 and 100),
  last_accessed_at timestamptz not null default timezone('utc', now()),
  last_lesson_id uuid references public.lessons (id) on delete set null,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, program_id)
);

create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  granted_by uuid not null references public.profiles (id),
  granted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index if not exists programs_is_published_idx on public.programs (is_published);
create index if not exists programs_level_idx on public.programs (level);
create index if not exists programs_slug_idx on public.programs (slug);
create index if not exists program_categories_category_id_idx on public.program_categories (category_id);
create index if not exists weeks_program_id_idx on public.weeks (program_id);
create index if not exists lessons_program_id_idx on public.lessons (program_id);
create index if not exists lessons_week_id_sort_order_idx on public.lessons (week_id, sort_order);
create index if not exists lessons_free_preview_idx
  on public.lessons (program_id, is_free_preview)
  where is_free_preview = true;
create index if not exists user_progress_user_id_idx on public.user_progress (user_id);
create index if not exists user_progress_program_id_idx on public.user_progress (program_id);
create index if not exists access_grants_user_id_idx on public.access_grants (user_id);
create index if not exists access_grants_program_id_idx on public.access_grants (program_id);
create index if not exists access_grants_user_program_idx on public.access_grants (user_id, program_id);
create index if not exists access_grants_active_idx on public.access_grants (user_id, program_id, expires_at);

-- ---------------------------------------------------------------------------
-- Triggers de updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

drop trigger if exists weeks_set_updated_at on public.weeks;
create trigger weeks_set_updated_at
before update on public.weeks
for each row execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Perfil automático no cadastro
-- ---------------------------------------------------------------------------

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
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, name, email, role)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    'Aluno'
  ),
  coalesce(u.email, u.id::text || '@local'),
  'student'
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Funções (depois das tabelas)
-- ---------------------------------------------------------------------------

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

create or replace function public.can_self_promote_to_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(coalesce(u.email, '')) = 'fabiano.freitas@gmail.com'
    );
$$;

create or replace function public.has_active_access(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.access_grants ag
      where ag.user_id = auth.uid()
        and ag.program_id = p_program_id
        and (ag.expires_at is null or ag.expires_at > timezone('utc', now()))
    );
$$;

create or replace function public.can_read_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.programs p
      where p.id = p_program_id
        and p.is_published = true
    );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.can_self_promote_to_admin() from public;
revoke all on function public.has_active_access(uuid) from public;
revoke all on function public.can_read_program(uuid) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_self_promote_to_admin() to authenticated;
grant execute on function public.has_active_access(uuid) to authenticated;
grant execute on function public.can_read_program(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.coach_allowlist enable row level security;
alter table public.categories enable row level security;
alter table public.programs enable row level security;
alter table public.program_categories enable row level security;
alter table public.weeks enable row level security;
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;
alter table public.access_grants enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

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

drop policy if exists "coach_allowlist_admin_all" on public.coach_allowlist;
create policy "coach_allowlist_admin_all"
on public.coach_allowlist for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_authenticated"
on public.categories for select
to authenticated
using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "programs_select_published_or_admin" on public.programs;
create policy "programs_select_published_or_admin"
on public.programs for select
to authenticated
using (is_published = true or public.is_admin());

drop policy if exists "programs_admin_write" on public.programs;
create policy "programs_admin_write"
on public.programs for insert
to authenticated
with check (public.is_admin());

drop policy if exists "programs_admin_update" on public.programs;
create policy "programs_admin_update"
on public.programs for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "programs_admin_delete" on public.programs;
create policy "programs_admin_delete"
on public.programs for delete
to authenticated
using (public.is_admin());

drop policy if exists "program_categories_select_authenticated" on public.program_categories;
create policy "program_categories_select_authenticated"
on public.program_categories for select
to authenticated
using (public.can_read_program(program_id) or public.is_admin());

drop policy if exists "program_categories_admin_write" on public.program_categories;
create policy "program_categories_admin_write"
on public.program_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "weeks_select_with_access" on public.weeks;
create policy "weeks_select_with_access"
on public.weeks for select
to authenticated
using (
  public.is_admin()
  or public.has_active_access(program_id)
  or exists (
    select 1
    from public.lessons l
    where l.week_id = weeks.id
      and l.is_free_preview = true
  )
);

drop policy if exists "weeks_admin_write" on public.weeks;
create policy "weeks_admin_write"
on public.weeks for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "lessons_select_with_access_or_preview" on public.lessons;
create policy "lessons_select_with_access_or_preview"
on public.lessons for select
to authenticated
using (
  public.is_admin()
  or public.has_active_access(program_id)
  or is_free_preview = true
);

drop policy if exists "lessons_admin_write" on public.lessons;
create policy "lessons_admin_write"
on public.lessons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_progress_select_own_or_admin" on public.user_progress;
create policy "user_progress_select_own_or_admin"
on public.user_progress for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own"
on public.user_progress for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own"
on public.user_progress for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "user_progress_delete_own_or_admin" on public.user_progress;
create policy "user_progress_delete_own_or_admin"
on public.user_progress for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "access_grants_select_own_or_admin" on public.access_grants;
create policy "access_grants_select_own_or_admin"
on public.access_grants for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "access_grants_admin_insert" on public.access_grants;
create policy "access_grants_admin_insert"
on public.access_grants for insert
to authenticated
with check (public.is_admin());

drop policy if exists "access_grants_admin_delete" on public.access_grants;
create policy "access_grants_admin_delete"
on public.access_grants for delete
to authenticated
using (public.is_admin());

notify pgrst, 'reload schema';
