#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const PASSWORD = '123456';

function loadEnvFile() {
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] ??= value;
  }
}

loadEnvFile();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
  console.error(
    'Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const canAdmin = Boolean(serviceRoleKey);

const TEST_USERS = [
  {
    email: 'usuario@teste.com',
    name: 'Usuário Teste',
    weightKg: 78,
    heightCm: 175,
    age: 32,
    goal: 'hipertrofia',
    onboarded: true,
    grantPlanSlugs: ['treino-a', 'treino-a-qa'],
  },
  {
    email: 'aluno@teste.com',
    name: 'Aluno Teste',
    weightKg: 82,
    heightCm: 178,
    age: 29,
    goal: 'condicionamento',
    onboarded: true,
    grantPlanSlugs: ['treino-a', 'treino-a-qa'],
  },
  {
    email: 'novato@teste.com',
    name: 'Novato Teste',
    weightKg: 70,
    heightCm: 168,
    age: 26,
    goal: 'emagrecimento',
    onboarded: true,
    grantPlanSlugs: [],
  },
  {
    email: 'camila.alves@biagym.qa',
    name: 'Camila Alves Rocha',
    weightKg: 68,
    heightCm: 164,
    age: 29,
    goal: 'emagrecimento',
    onboarded: false,
    grantPlanSlugs: [],
  },
  {
    email: 'rafael.mendonca@biagym.qa',
    name: 'Rafael Mendonça Dias',
    weightKg: 92,
    heightCm: 181,
    age: 34,
    goal: 'hipertrofia',
    onboarded: true,
    grantPlanSlugs: [],
  },
  {
    email: 'juliana.nogueira@biagym.qa',
    name: 'Juliana Costa Nogueira',
    weightKg: 61,
    heightCm: 168,
    age: 27,
    goal: 'condicionamento',
    onboarded: true,
    grantPlanSlugs: ['treino-a', 'treino-a-qa'],
  },
  {
    email: 'bruno.pires@biagym.qa',
    name: 'Bruno Henrique Pires',
    weightKg: 84,
    heightCm: 176,
    age: 38,
    goal: 'hipertrofia',
    onboarded: true,
    grantPlanSlugs: ['treino-a', 'treino-a-qa'],
  },
  {
    email: 'larissa.lima@biagym.qa',
    name: 'Larissa Fonseca Lima',
    weightKg: 72,
    heightCm: 170,
    age: 41,
    goal: 'saude',
    onboarded: true,
    grantPlanSlugs: ['treino-a', 'treino-a-qa'],
  },
  {
    email: 'diego.oliveira@biagym.qa',
    name: 'Diego Santana Oliveira',
    weightKg: 78,
    heightCm: 175,
    age: 31,
    goal: 'condicionamento',
    onboarded: true,
    grantPlanSlugs: ['treino-a', 'treino-b', 'treino-a-qa', 'treino-b-qa'],
  },
  {
    email: 'marina.teixeira@biagym.qa',
    name: 'Marina Teixeira Gomes',
    weightKg: 55,
    heightCm: 160,
    age: 24,
    goal: 'mobilidade',
    onboarded: true,
    grantPlanSlugs: [],
  },
];

async function findUserIdByEmail(email) {
  const target = email.toLowerCase();
  let page = 1;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }

    const found = data.users.find((user) => (user.email ?? '').toLowerCase() === target);
    if (found?.id) {
      return found.id;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUserPublic(email, name) {
  const { error } = await supabase.auth.signUp({
    email,
    password: PASSWORD,
    options: {
      data: { name, full_name: name, role: 'student' },
    },
  });

  await supabase.auth.signOut().catch(() => undefined);

  if (error && !error.message.toLowerCase().includes('already') && error.status !== 422) {
    throw error;
  }

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });

  if (signInError || !data.user?.id) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error(
      `${email}: conta não entrou com 123456 (${signInError?.message ?? 'sem sessão'}). Coloque SUPABASE_SERVICE_ROLE_KEY no .env e rode de novo para resetar a senha.`,
    );
  }

  return { id: data.user.id, created: !error };
}

async function ensureAuthUser(email, name) {
  if (!canAdmin) {
    return ensureAuthUserPublic(email, name);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, full_name: name, role: 'student' },
  });

  if (!error && data.user?.id) {
    return { id: data.user.id, created: true };
  }

  const alreadyExists =
    error?.message?.toLowerCase().includes('already') ||
    error?.message?.toLowerCase().includes('registered') ||
    error?.status === 422;

  if (!alreadyExists) {
    throw error ?? new Error(`Não foi possível criar ${email}`);
  }

  const existingId = await findUserIdByEmail(email);
  if (!existingId) {
    throw new Error(`Usuário ${email} já existe, mas não foi encontrado para atualizar a senha.`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingId, {
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, full_name: name, role: 'student' },
  });

  if (updateError) {
    throw updateError;
  }

  return { id: existingId, created: false };
}

async function upsertProfile(user) {
  if (!user.id) {
    return;
  }

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: 'student',
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw error;
  }

  if (!user.onboarded) {
    await supabase
      .from('profiles')
      .update({
        weight_kg: null,
        height_cm: null,
        age: null,
        goal: null,
        onboarding_completed_at: null,
      })
      .eq('id', user.id);
    return;
  }

  const { error: onboardError } = await supabase
    .from('profiles')
    .update({
      weight_kg: user.weightKg,
      height_cm: user.heightCm,
      age: user.age,
      goal: user.goal,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (onboardError && !onboardError.message?.includes('onboarding_completed_at')) {
    throw onboardError;
  }
}

async function grantPlans(userId, slugs, adminId) {
  if (!adminId || slugs.length === 0) {
    return 0;
  }

  const { data: plans, error } = await supabase
    .from('training_plans')
    .select('id, slug')
    .in('slug', slugs);

  if (error || !plans?.length) {
    return 0;
  }

  let granted = 0;
  for (const plan of plans) {
    const { error: grantError } = await supabase.from('training_plan_grants').upsert(
      {
        user_id: userId,
        plan_id: plan.id,
        granted_by: adminId,
      },
      { onConflict: 'user_id,plan_id' },
    );

    if (!grantError) {
      granted += 1;
    }
  }

  return granted;
}

async function main() {
  console.log(
    canAdmin
      ? 'Cadastrando alunos fictícios com senha 123456...'
      : 'Cadastrando alunos fictícios pelo login público (senha 123456)...',
  );

  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  for (const user of TEST_USERS) {
    const auth = await ensureAuthUser(user.email, user.name);
    await upsertProfile({ ...user, id: auth.id });
    const granted = canAdmin ? await grantPlans(auth.id, user.grantPlanSlugs, admin?.id) : 0;
    if (!canAdmin) {
      await supabase.auth.signOut().catch(() => undefined);
    }
    const status = auth.created ? 'criado' : 'já existia / login ok';
    const grantNote = granted > 0 ? ` · ${granted} treino(s) liberado(s)` : '';
    console.log(`OK ${user.email} (${status})${grantNote}`);
  }

  console.log('\nTodas as contas acima entram com senha 123456.');
  console.log('Para a demo: usuario@teste.com (com treino) e novato@teste.com (sem treino).');
}

main().catch((error) => {
  console.error('Falha no seed de usuários:', error.message ?? error);
  process.exit(1);
});
