-- BiAGym – alunos fictícios para QA (antes da demo)
-- Execute no SQL Editor DEPOIS de schema.sql + fix-admin.sql.
-- Opcional mas recomendado: phase12-coaching.sql e phase13-workouts.sql.
-- Idempotente: pode rodar de novo sem duplicar e-mails.
--
-- Senha de todos os alunos: 123456

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists weight_kg numeric(5, 2),
  add column if not exists height_cm numeric(5, 1),
  add column if not exists age integer,
  add column if not exists goal text,
  add column if not exists onboarding_completed_at timestamptz;

create or replace function public.seed_qa_student(
  p_email text,
  p_name text,
  p_password text,
  p_weight numeric,
  p_height numeric,
  p_age integer,
  p_goal text,
  p_onboarded boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_instance uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email);

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    select id into v_instance from auth.instances limit 1;
    if v_instance is null then
      v_instance := '00000000-0000-0000-0000-000000000000';
    end if;

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      v_instance,
      v_user_id,
      'authenticated',
      'authenticated',
      lower(p_email),
      crypt(p_password, gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name, 'full_name', p_name, 'role', 'student'),
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
      'email',
      v_user_id::text,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    );
  end if;

  insert into public.profiles (id, name, email, role)
  values (v_user_id, p_name, lower(p_email), 'student')
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        role = 'student';

  if p_onboarded then
    update public.profiles
    set
      weight_kg = p_weight,
      height_cm = p_height,
      age = p_age,
      goal = p_goal,
      onboarding_completed_at = timezone('utc', now())
    where id = v_user_id;
  else
    update public.profiles
    set
      weight_kg = null,
      height_cm = null,
      age = null,
      goal = null,
      onboarding_completed_at = null
    where id = v_user_id;
  end if;

  return v_user_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7 alunas/os de QA
-- ---------------------------------------------------------------------------

do $$
declare
  uid_camila uuid;
  uid_rafael uuid;
  uid_juliana uuid;
  uid_bruno uuid;
  uid_larissa uuid;
  uid_diego uuid;
  uid_marina uuid;
  admin_id uuid;
  program_id uuid;
  lesson_id uuid;
  plan_a uuid;
  plan_b uuid;
  exercise_id uuid;
  we_first uuid;
  we_second uuid;
begin
  uid_camila := public.seed_qa_student(
    'camila.alves@biagym.qa', 'Camila Alves Rocha', '123456',
    68, 164, 29, 'emagrecimento', false
  );
  uid_rafael := public.seed_qa_student(
    'rafael.mendonca@biagym.qa', 'Rafael Mendonça Dias', '123456',
    92, 181, 34, 'hipertrofia', true
  );
  uid_juliana := public.seed_qa_student(
    'juliana.nogueira@biagym.qa', 'Juliana Costa Nogueira', '123456',
    61, 168, 27, 'condicionamento', true
  );
  uid_bruno := public.seed_qa_student(
    'bruno.pires@biagym.qa', 'Bruno Henrique Pires', '123456',
    84, 176, 38, 'hipertrofia', true
  );
  uid_larissa := public.seed_qa_student(
    'larissa.lima@biagym.qa', 'Larissa Fonseca Lima', '123456',
    72, 170, 41, 'saude', true
  );
  uid_diego := public.seed_qa_student(
    'diego.oliveira@biagym.qa', 'Diego Santana Oliveira', '123456',
    78, 175, 31, 'condicionamento', true
  );
  uid_marina := public.seed_qa_student(
    'marina.teixeira@biagym.qa', 'Marina Teixeira Gomes', '123456',
    55, 160, 24, 'mobilidade', true
  );

  select id into admin_id from public.profiles where role = 'admin' limit 1;

  -- Programa de catálogo (Home / Loja)
  if to_regclass('public.programs') is not null then
    insert into public.programs (
      title, slug, description, cover_url, trainer_name, level, duration_weeks, is_published
    )
    values (
      'Base 4 semanas – QA',
      'base-4-semanas-qa',
      'Programa de teste para catálogo e acesso individual.',
      'https://placehold.co/800x450/0B0B0B/E8573A?text=BiAGym',
      'BiAGym',
      'iniciante',
      4,
      true
    )
    on conflict (slug) do update set is_published = true
    returning id into program_id;

    if program_id is null then
      select id into program_id from public.programs where slug = 'base-4-semanas-qa';
    end if;

    insert into public.weeks (program_id, week_number, title)
    values (program_id, 1, 'Semana 1')
    on conflict (program_id, week_number) do nothing;

    insert into public.lessons (
      program_id, week_id, title, description, video_url, duration_seconds, sort_order, is_free_preview
    )
    select
      program_id,
      w.id,
      'Aula 1 – Avaliação inicial',
      'Aula de preview para testes de catálogo.',
      'pending-upload',
      180,
      1,
      true
    from public.weeks w
    where w.program_id = program_id and w.week_number = 1
    on conflict (week_id, sort_order) do nothing;

    insert into public.lessons (
      program_id, week_id, title, description, video_url, duration_seconds, sort_order, is_free_preview
    )
    select
      program_id,
      w.id,
      'Aula 2 – Circuito base',
      'Aula protegida por access grant.',
      'pending-upload',
      420,
      2,
      false
    from public.weeks w
    where w.program_id = program_id and w.week_number = 1
    on conflict (week_id, sort_order) do nothing;

    if admin_id is not null then
      insert into public.access_grants (user_id, program_id, granted_by)
      select uid_larissa, program_id, admin_id
      where not exists (
        select 1
        from public.access_grants ag
        where ag.user_id = uid_larissa and ag.program_id = program_id
      );
    end if;

    select l.id into lesson_id
    from public.lessons l
    where l.program_id = program_id
    order by l.sort_order
    limit 1;

    if lesson_id is not null then
      insert into public.user_progress (
        user_id, program_id, completed_lesson_ids, percent_complete, last_lesson_id
      )
      values (uid_larissa, program_id, array[lesson_id], 50, lesson_id)
      on conflict (user_id, program_id) do update
        set completed_lesson_ids = excluded.completed_lesson_ids,
            percent_complete = excluded.percent_complete,
            last_lesson_id = excluded.last_lesson_id;
    end if;
  end if;

  -- Treinos A/B (aba Treinos) — só se phase13 já foi aplicada e há um admin
  if to_regclass('public.training_plans') is not null and admin_id is not null then
    insert into public.exercises (name, description, muscle_group, video_url, created_by)
    select v.name, v.description, v.muscle_group, '', admin_id
    from (
      values
        ('Agachamento livre', 'Pés na largura dos ombros, desce controlado.', 'pernas'),
        ('Supino máquina', 'Peito estufa, cotovelos a 45°.', 'peito')
    ) as v(name, description, muscle_group)
    where not exists (
      select 1 from public.exercises e
      where e.created_by = admin_id and e.name = v.name
    );

    -- Sem unique em name: pega o primeiro do admin
    select id into exercise_id
    from public.exercises
    where created_by = admin_id
    order by created_at
    limit 1;

    insert into public.training_plans (title, slug, description, is_published, sort_order, created_by)
    values
      ('Treino A – QA', 'treino-a-qa', 'Superior + core para bateria de testes.', true, 1, admin_id),
      ('Treino B – QA', 'treino-b-qa', 'Inferior para bateria de testes.', true, 2, admin_id)
    on conflict (slug) do update
      set is_published = true,
          title = excluded.title;

    select id into plan_a from public.training_plans where slug = 'treino-a-qa';
    select id into plan_b from public.training_plans where slug = 'treino-b-qa';

    insert into public.workout_exercises (plan_id, exercise_id, sets, reps, rest_seconds, sort_order)
    select plan_a, e.id, 3, '12', 60, row_number() over (order by e.created_at)::int - 1
    from public.exercises e
    where e.created_by = admin_id
      and plan_a is not null
      and not exists (
        select 1 from public.workout_exercises we
        where we.plan_id = plan_a and we.exercise_id = e.id
      )
    limit 2;

    -- Com grants no plano, só quem foi liberado vê (regra can_read_training_plan)
    insert into public.training_plan_grants (user_id, plan_id, granted_by)
    values
      (uid_juliana, plan_a, admin_id),
      (uid_bruno, plan_a, admin_id),
      (uid_diego, plan_a, admin_id),
      (uid_diego, plan_b, admin_id),
      (uid_larissa, plan_a, admin_id)
    on conflict (user_id, plan_id) do nothing;

    select id into we_first
    from public.workout_exercises
    where plan_id = plan_a
    order by sort_order
    limit 1;

    select id into we_second
    from public.workout_exercises
    where plan_id = plan_a
    order by sort_order
    offset 1
    limit 1;

    if we_first is not null then
      insert into public.workout_sessions (user_id, plan_id, completed_exercise_ids, completed_at)
      select uid_bruno, plan_a, array[we_first], timezone('utc', now())
      where not exists (
        select 1 from public.workout_sessions s
        where s.user_id = uid_bruno and s.plan_id = plan_a
      );
    end if;

    if we_first is not null then
      insert into public.workout_sessions (user_id, plan_id, completed_exercise_ids, completed_at)
      select
        uid_diego,
        plan_a,
        case
          when we_second is not null then array[we_first, we_second]
          else array[we_first]
        end,
        timezone('utc', now())
      where not exists (
        select 1 from public.workout_sessions s
        where s.user_id = uid_diego and s.plan_id = plan_a
      );
    end if;
  end if;
end;
$$;

-- Conferência
select
  p.email,
  p.name,
  p.role,
  p.weight_kg,
  p.height_cm,
  p.age,
  p.goal,
  (p.onboarding_completed_at is not null) as onboarded
from public.profiles p
where p.email like '%@biagym.qa'
order by p.email;
