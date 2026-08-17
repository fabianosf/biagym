#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function loadEnvFile() {
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
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

const SAMPLE_VIDEOS = [
  {
    fileName: 'video1.mp4',
    title: 'Aula 1 – Boas-vindas e aquecimento',
    description: 'Introdução ao programa e aquecimento guiado.',
    durationSeconds: 600,
    isFreePreview: true,
    weekNumber: 1,
    order: 1,
  },
  {
    fileName: 'video2.mp4',
    title: 'Aula 2 – Técnica de agachamento',
    description: 'Fundamentos do agachamento com foco em postura.',
    durationSeconds: 720,
    isFreePreview: false,
    weekNumber: 1,
    order: 2,
  },
  {
    fileName: 'video3.mp4',
    title: 'Aula 3 – Core e estabilidade',
    description: 'Exercícios de core para suporte ao treino de força.',
    durationSeconds: 540,
    isFreePreview: false,
    weekNumber: 2,
    order: 1,
  },
  {
    fileName: 'video4.mp4',
    title: 'Aula 4 – Empurrar e puxar',
    description: 'Movimentos compostos para membros superiores.',
    durationSeconds: 780,
    isFreePreview: false,
    weekNumber: 2,
    order: 2,
  },
  {
    fileName: 'video5.mp4',
    title: 'Aula 5 – Condicionamento metabólico',
    description: 'Circuito de condicionamento para fechar a semana.',
    durationSeconds: 660,
    isFreePreview: false,
    weekNumber: 3,
    order: 1,
  },
];

const PROGRAM_SLUG = 'programa-iniciante';
const BUCKET = 'lesson-videos';

async function ensureProgram() {
  const { data: existing } = await supabase
    .from('programs')
    .select('id, slug')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from('programs')
    .insert({
      title: 'Programa Iniciante',
      slug: PROGRAM_SLUG,
      description: 'Programa introdutório com aulas em vídeo de exemplo.',
      cover_url: 'https://placehold.co/800x450',
      trainer_name: 'Coach BiAGym',
      level: 'iniciante',
      duration_weeks: 4,
      is_published: true,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function ensureWeek(programId, weekNumber) {
  const { data: existing } = await supabase
    .from('weeks')
    .select('id')
    .eq('program_id', programId)
    .eq('week_number', weekNumber)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from('weeks')
    .insert({
      program_id: programId,
      week_number: weekNumber,
      title: `Semana ${weekNumber}`,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function uploadVideo(programId, lessonId, filePath, fileName) {
  const fileBuffer = readFileSync(filePath);
  const storagePath = `${programId}/${lessonId}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    contentType: 'video/mp4',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function upsertLesson(programId, weekId, sample) {
  const { data: existing } = await supabase
    .from('lessons')
    .select('id, video_url')
    .eq('week_id', weekId)
    .eq('sort_order', sample.order)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      program_id: programId,
      week_id: weekId,
      title: sample.title,
      description: sample.description,
      video_url: 'pending-upload',
      duration_seconds: sample.durationSeconds,
      sort_order: sample.order,
      is_free_preview: sample.isFreePreview,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function main() {
  console.log('Iniciando seed de conteúdo demo...');

  const programId = await ensureProgram();
  console.log(`Programa: ${programId}`);

  for (let weekNumber = 1; weekNumber <= 4; weekNumber += 1) {
    await ensureWeek(programId, weekNumber);
  }

  for (const sample of SAMPLE_VIDEOS) {
    const weekId = await ensureWeek(programId, sample.weekNumber);
    const lessonId = await upsertLesson(programId, weekId, sample);
    const filePath = join(projectRoot, 'videos', sample.fileName);

    if (!existsSync(filePath)) {
      console.warn(`Arquivo não encontrado: ${filePath}`);
      continue;
    }

    const publicUrl = await uploadVideo(programId, lessonId, filePath, sample.fileName);
    const { error } = await supabase
      .from('lessons')
      .update({ video_url: publicUrl })
      .eq('id', lessonId);

    if (error) {
      throw error;
    }

    console.log(`OK: ${sample.title}`);
  }

  console.log('\nSeed concluído. Abra o app e acesse o Programa Iniciante.');
  console.log('Para liberar acesso a um aluno, use Admin > Acessos ou rode supabase/promote-admin.sql.');
}

main().catch((error) => {
  console.error('Falha no seed:', error.message ?? error);
  process.exit(1);
});
