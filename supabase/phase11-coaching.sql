-- TreinosAtleta – Fase coaching (legado)
-- Prefira executar supabase/phase12-coaching.sql, que já inclui este conteúdo.


-- ---------------------------------------------------------------------------
-- Coach role (evita o RLS bloquear o primeiro admin)
-- ---------------------------------------------------------------------------

create or replace function public.claim_coach_role()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles
  set role = 'admin'
  where id = auth.uid()
  returning * into current_profile;

  if current_profile.id is null then
    raise exception 'profile_not_found';
  end if;

  return current_profile;
end;
$$;

revoke all on function public.claim_coach_role() from public;
grant execute on function public.claim_coach_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Perfil físico + onboarding
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists weight_kg numeric(5, 2),
  add column if not exists height_cm numeric(5, 1),
  add column if not exists age integer,
  add column if not exists goal text
    check (goal is null or goal in (
      'emagrecimento',
      'hipertrofia',
      'condicionamento',
      'saude',
      'mobilidade'
    )),
  add column if not exists onboarding_completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Nutrição
-- ---------------------------------------------------------------------------

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  student_user_id uuid references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists nutrition_plans_set_updated_at on public.nutrition_plans;
create trigger nutrition_plans_set_updated_at
before update on public.nutrition_plans
for each row execute function public.set_updated_at();

create table if not exists public.nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.nutrition_plans (id) on delete cascade,
  meal_type text not null check (meal_type in ('cafe', 'almoco', 'lanche', 'jantar')),
  title text not null,
  description text,
  time_label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Agenda de treinos
-- ---------------------------------------------------------------------------

create table if not exists public.training_slots (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  duration_minutes integer not null default 60,
  title text not null,
  notes text,
  program_id uuid references public.programs (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists training_slots_set_updated_at on public.training_slots;
create trigger training_slots_set_updated_at
before update on public.training_slots
for each row execute function public.set_updated_at();

create index if not exists nutrition_plans_student_idx on public.nutrition_plans (student_user_id);
create index if not exists training_slots_student_idx on public.training_slots (student_user_id, weekday);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.nutrition_plans enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.training_slots enable row level security;

drop policy if exists "nutrition_plans_select" on public.nutrition_plans;
create policy "nutrition_plans_select"
on public.nutrition_plans for select
to authenticated
using (
  public.is_admin()
  or student_user_id = auth.uid()
  or student_user_id is null
);

drop policy if exists "nutrition_plans_admin_write" on public.nutrition_plans;
create policy "nutrition_plans_admin_write"
on public.nutrition_plans for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "nutrition_meals_select" on public.nutrition_meals;
create policy "nutrition_meals_select"
on public.nutrition_meals for select
to authenticated
using (
  exists (
    select 1 from public.nutrition_plans p
    where p.id = plan_id
      and (
        public.is_admin()
        or p.student_user_id = auth.uid()
        or p.student_user_id is null
      )
  )
);

drop policy if exists "nutrition_meals_admin_write" on public.nutrition_meals;
create policy "nutrition_meals_admin_write"
on public.nutrition_meals for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "training_slots_select" on public.training_slots;
create policy "training_slots_select"
on public.training_slots for select
to authenticated
using (public.is_admin() or student_user_id = auth.uid());

drop policy if exists "training_slots_admin_write" on public.training_slots;
create policy "training_slots_admin_write"
on public.training_slots for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
