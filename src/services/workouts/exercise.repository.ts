import type { CreateExerciseInput, Exercise, UpdateExerciseInput } from '@/domain/workout';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { ExerciseRow } from '../supabase/types';
import { mapExerciseRow } from './workout.mapper';

function isMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('exercises') ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    error.code === 'PGRST205' ||
    error.code === '42P01'
  );
}

export async function listExercises(): Promise<Exercise[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw mapSupabaseDataError(
      isMissing(error)
        ? {
            ...error,
            message:
              'As tabelas de exercícios ainda não existem. Execute supabase/phase13-workouts.sql no SQL Editor.',
          }
        : error,
    );
  }

  return ((data ?? []) as ExerciseRow[]).map(mapExerciseRow);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('exercises').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return data ? mapExerciseRow(data as ExerciseRow) : null;
}

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      muscle_group: input.muscleGroup,
      video_url: input.videoUrl,
      thumbnail_url: input.thumbnailUrl ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível criar o exercício.' });
  }

  return mapExerciseRow(data as ExerciseRow);
}

export async function updateExercise(id: string, input: UpdateExerciseInput): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const payload: {
    name: string;
    description: string | null;
    muscle_group: string;
    video_url?: string;
    thumbnail_url?: string | null;
  } = {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    muscle_group: input.muscleGroup,
  };

  if (input.videoUrl) {
    payload.video_url = input.videoUrl;
  }

  if (input.thumbnailUrl !== undefined) {
    payload.thumbnail_url = input.thumbnailUrl;
  }

  const { error } = await supabase.from('exercises').update(payload).eq('id', id);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function deleteExercise(id: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('exercises').delete().eq('id', id);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
