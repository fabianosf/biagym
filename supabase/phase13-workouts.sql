-- BiAGym – Treinos A/B/C no estilo academia
-- Execute no SQL Editor. Inclui claim_coach_role para o botão "Sou admin".
-- É idempotente.

-- ---------------------------------------------------------------------------
-- Coach role (use também supabase/fix-admin.sql se o botão Sou admin falhar)
-- ---------------------------------------------------------------------------

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
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select u.email into current_email from auth.users u where u.id = auth.uid();

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

revoke all on function public.claim_coach_role() from public;
grant execute on function public.claim_coach_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Catálogo de exercícios
-- ---------------------------------------------------------------------------

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  muscle_group text not null default 'corpo_todo',
  video_url text not null default '',
  thumbnail_url text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Treinos (Treino A, Treino B...)
-- ---------------------------------------------------------------------------

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists training_plans_set_updated_at on public.training_plans;
create trigger training_plans_set_updated_at
before update on public.training_plans
for each row execute function public.set_updated_at();

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  sets integer not null default 3,
  reps text not null default '12',
  load_kg numeric(6, 2),
  rest_seconds integer not null default 60,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_exercises_plan_idx
  on public.workout_exercises (plan_id, sort_order);

create table if not exists public.training_plan_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  granted_by uuid not null references public.profiles (id),
  granted_at timestamptz not null default timezone('utc', now()),
  unique (user_id, plan_id)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  completed_exercise_ids uuid[] not null default '{}',
  completed_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_sessions_user_idx
  on public.workout_sessions (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- Acesso
-- ---------------------------------------------------------------------------

create or replace function public.can_read_training_plan(p_plan_id uuid)
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
      from public.training_plans tp
      join public.training_plan_grants g on g.plan_id = tp.id
      where tp.id = p_plan_id
        and tp.is_published = true
        and g.user_id = auth.uid()
    );
$$;

revoke all on function public.can_read_training_plan(uuid) from public;
grant execute on function public.can_read_training_plan(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.exercises enable row level security;
alter table public.training_plans enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.training_plan_grants enable row level security;
alter table public.workout_sessions enable row level security;

drop policy if exists "exercises_select" on public.exercises;
create policy "exercises_select"
on public.exercises for select
to authenticated
using (true);

drop policy if exists "exercises_admin_write" on public.exercises;
create policy "exercises_admin_write"
on public.exercises for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "training_plans_select" on public.training_plans;
create policy "training_plans_select"
on public.training_plans for select
to authenticated
using (public.can_read_training_plan(id));

drop policy if exists "training_plans_admin_write" on public.training_plans;
create policy "training_plans_admin_write"
on public.training_plans for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "workout_exercises_select" on public.workout_exercises;
create policy "workout_exercises_select"
on public.workout_exercises for select
to authenticated
using (public.can_read_training_plan(plan_id));

drop policy if exists "workout_exercises_admin_write" on public.workout_exercises;
create policy "workout_exercises_admin_write"
on public.workout_exercises for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "training_plan_grants_select" on public.training_plan_grants;
create policy "training_plan_grants_select"
on public.training_plan_grants for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "training_plan_grants_admin_write" on public.training_plan_grants;
create policy "training_plan_grants_admin_write"
on public.training_plan_grants for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "workout_sessions_select" on public.workout_sessions;
create policy "workout_sessions_select"
on public.workout_sessions for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "workout_sessions_insert" on public.workout_sessions;
create policy "workout_sessions_insert"
on public.workout_sessions for insert
to authenticated
with check (user_id = auth.uid());
