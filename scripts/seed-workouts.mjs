#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

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

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Defina EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env para rodar o seed.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'lesson-videos';

const EXERCISES = [
  {
    fileName: 'video1.mp4',
    name: 'Aquecimento articular',
    muscleGroup: 'corpo_todo',
    description: 'Mobilidade de ombros, quadril e tornozelos antes da carga.',
    sets: 2,
    reps: '12',
    loadKg: null,
    restSeconds: 30,
  },
  {
    fileName: 'video2.mp4',
    name: 'Agachamento',
    muscleGroup: 'pernas',
    description: 'Pés na largura do quadril, joelho alinhado com o pé.',
    sets: 4,
    reps: '8-10',
    loadKg: 40,
    restSeconds: 90,
  },
  {
    fileName: 'video3.mp4',
    name: 'Prancha e core',
    muscleGroup: 'core',
    description: 'Mantenha o tronco firme. Não deixe o quadril cair.',
    sets: 3,
    reps: '40s',
    loadKg: null,
    restSeconds: 45,
  },
  {
    fileName: 'video4.mp4',
    name: 'Remada e empurrar',
    muscleGroup: 'costas',
    description: 'Escápulas juntas na puxada. Controle a descida.',
    sets: 4,
    reps: '10-12',
    loadKg: 20,
    restSeconds: 75,
  },
  {
    fileName: 'video5.mp4',
    name: 'Condicionamento',
    muscleGroup: 'cardio',
    description: 'Circuito contínuo, ritmo desafiador e técnica primeiro.',
    sets: 3,
    reps: '45s',
    loadKg: null,
    restSeconds: 30,
  },
];

const PLANS = [
  {
    title: 'Treino A',
    slug: 'treino-a',
    description: 'Inferiores e aquecimento — 40 a 50 min.',
    exerciseIndexes: [0, 1],
    sortOrder: 1,
  },
  {
    title: 'Treino B',
    slug: 'treino-b',
    description: 'Core e puxar — 40 min.',
    exerciseIndexes: [2, 3],
    sortOrder: 2,
  },
  {
    title: 'Treino C',
    slug: 'treino-c',
    description: 'Condicionamento e revisão — 35 min.',
    exerciseIndexes: [4, 0],
    sortOrder: 3,
  },
];

async function getCoachId() {
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (admin?.id) {
    return admin.id;
  }

  const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
  if (!anyProfile?.id) {
    throw new Error('Nenhum perfil encontrado. Entre no app uma vez antes de rodar o seed.');
  }

  return anyProfile.id;
}

async function uploadVideo(exerciseId, filePath, fileName) {
  const storagePath = `exercises/${exerciseId}/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, readFileSync(filePath), {
    contentType: 'video/mp4',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function ensureExercise(coachId, sample) {
  const { data: existing } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', sample.name)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: sample.name,
      description: sample.description,
      muscle_group: sample.muscleGroup,
      video_url: 'pending-upload',
      created_by: coachId,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function ensurePlan(coachId, plan) {
  const { data: existing } = await supabase
    .from('training_plans')
    .select('id')
    .eq('slug', plan.slug)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from('training_plans')
      .update({ is_published: true, title: plan.title, description: plan.description })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('training_plans')
    .insert({
      title: plan.title,
      slug: plan.slug,
      description: plan.description,
      is_published: true,
      sort_order: plan.sortOrder,
      created_by: coachId,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function main() {
  console.log('Seed dos Treinos A/B/C a partir da pasta videos/...');
  const coachId = await getCoachId();
  const exerciseIds = [];

  for (const sample of EXERCISES) {
    const exerciseId = await ensureExercise(coachId, sample);
    const filePath = join(projectRoot, 'videos', sample.fileName);
    if (existsSync(filePath)) {
      const publicUrl = await uploadVideo(exerciseId, filePath, sample.fileName);
      await supabase.from('exercises').update({ video_url: publicUrl }).eq('id', exerciseId);
      console.log(`Exercício: ${sample.name}`);
    } else {
      console.warn(`Vídeo não encontrado: ${filePath}`);
    }
    exerciseIds.push(exerciseId);
  }

  for (const plan of PLANS) {
    const planId = await ensurePlan(coachId, plan);
    await supabase.from('workout_exercises').delete().eq('plan_id', planId);

    for (const [order, exerciseIndex] of plan.exerciseIndexes.entries()) {
      const sample = EXERCISES[exerciseIndex];
      await supabase.from('workout_exercises').insert({
        plan_id: planId,
        exercise_id: exerciseIds[exerciseIndex],
        sets: sample.sets,
        reps: sample.reps,
        load_kg: sample.loadKg,
        rest_seconds: sample.restSeconds,
        sort_order: order,
      });
    }

    console.log(`OK: ${plan.title}`);
  }

  console.log('\nSeed concluído. Na aba Treinos o aluno vê Treino A, B e C.');
}

main().catch((error) => {
  console.error('Falha no seed:', error.message ?? error);
  process.exit(1);
});
