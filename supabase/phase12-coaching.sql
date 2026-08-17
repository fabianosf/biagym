-- TreinosAtleta – Coaching completo (onboarding, nutrição, agenda, evolução, recados)
-- Execute no SQL Editor do Supabase. É idempotente: pode rodar mesmo se a fase 11 já foi aplicada.

-- ---------------------------------------------------------------------------
-- Allowlist da treinadora
-- Depois do primeiro admin, só e-mails desta lista podem virar treinador.
-- Para adicionar outra treinadora:
--   insert into public.coach_allowlist (email) values ('email@exemplo.com');
-- ---------------------------------------------------------------------------

create table if not exists public.coach_allowlist (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.coach_allowlist enable row level security;

drop policy if exists "coach_allowlist_admin_all" on public.coach_allowlist;
create policy "coach_allowlist_admin_all"
on public.coach_allowlist for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

  update public.profiles
  set role = 'admin'
  where id = auth.uid()
  returning * into current_profile;

  if current_profile.id is null then
    raise exception 'profile_not_found';
  end if;

  insert into public.coach_allowlist (email)
  values (lower(current_email))
  on conflict (email) do nothing;

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
  add column if not exists goal text,
  add column if not exists onboarding_completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Nutrição (+ macros)
-- ---------------------------------------------------------------------------

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  student_user_id uuid references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  is_published boolean not null default true,
  calories_kcal integer,
  protein_g numeric(6, 1),
  carbs_g numeric(6, 1),
  fat_g numeric(6, 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.nutrition_plans
  add column if not exists calories_kcal integer,
  add column if not exists protein_g numeric(6, 1),
  add column if not exists carbs_g numeric(6, 1),
  add column if not exists fat_g numeric(6, 1);

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

create index if not exists nutrition_plans_student_idx on public.nutrition_plans (student_user_id);

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

create index if not exists training_slots_student_idx on public.training_slots (student_user_id, weekday);

create table if not exists public.training_checkins (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.training_slots (id) on delete cascade,
  student_user_id uuid not null references public.profiles (id) on delete cascade,
  checkin_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (slot_id, checkin_date)
);

create index if not exists training_checkins_student_idx
  on public.training_checkins (student_user_id, checkin_date desc);

-- ---------------------------------------------------------------------------
-- Evolução física
-- ---------------------------------------------------------------------------

create table if not exists public.body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(5, 2) not null,
  notes text,
  photo_url text,
  recorded_at date not null default (timezone('America/Sao_Paulo', now()))::date,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists body_logs_user_idx on public.body_logs (user_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- Recados da treinadora
-- ---------------------------------------------------------------------------

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists coach_messages_thread_idx
  on public.coach_messages (student_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Storage de fotos de evolução
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'body-progress',
  'body-progress',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "body_progress_insert_own_or_admin" on storage.objects;
create policy "body_progress_insert_own_or_admin"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'body-progress'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

drop policy if exists "body_progress_authenticated_read" on storage.objects;
create policy "body_progress_authenticated_read"
on storage.objects for select
to authenticated
using (bucket_id = 'body-progress');

drop policy if exists "body_progress_delete_own_or_admin" on storage.objects;
create policy "body_progress_delete_own_or_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'body-progress'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.nutrition_plans enable row level security;
alter table public.nutrition_meals enable row level security;
alter table public.training_slots enable row level security;
alter table public.training_checkins enable row level security;
alter table public.body_logs enable row level security;
alter table public.coach_messages enable row level security;

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

drop policy if exists "training_checkins_select" on public.training_checkins;
create policy "training_checkins_select"
on public.training_checkins for select
to authenticated
using (public.is_admin() or student_user_id = auth.uid());

drop policy if exists "training_checkins_insert_own" on public.training_checkins;
create policy "training_checkins_insert_own"
on public.training_checkins for insert
to authenticated
with check (student_user_id = auth.uid() or public.is_admin());

drop policy if exists "training_checkins_delete_own_or_admin" on public.training_checkins;
create policy "training_checkins_delete_own_or_admin"
on public.training_checkins for delete
to authenticated
using (student_user_id = auth.uid() or public.is_admin());

drop policy if exists "body_logs_select" on public.body_logs;
create policy "body_logs_select"
on public.body_logs for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "body_logs_insert" on public.body_logs;
create policy "body_logs_insert"
on public.body_logs for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "body_logs_delete" on public.body_logs;
create policy "body_logs_delete"
on public.body_logs for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "coach_messages_select" on public.coach_messages;
create policy "coach_messages_select"
on public.coach_messages for select
to authenticated
using (public.is_admin() or student_user_id = auth.uid());

drop policy if exists "coach_messages_insert" on public.coach_messages;
create policy "coach_messages_insert"
on public.coach_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and (public.is_admin() or student_user_id = auth.uid())
);

drop policy if exists "coach_messages_update_read" on public.coach_messages;
create policy "coach_messages_update_read"
on public.coach_messages for update
to authenticated
using (public.is_admin() or student_user_id = auth.uid())
with check (public.is_admin() or student_user_id = auth.uid());
