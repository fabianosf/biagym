import type { EntityId, UserProgress } from '@/domain';

import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { UserProgressRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapSupabaseDataError,
  mapUserProgressRow,
  mapUserProgressToUpdate,
} from '../shared';

export async function getUserProgressByProgram(
  userId: EntityId,
  programId: EntityId,
): Promise<UserProgress | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .order('last_accessed_at', { ascending: false })
    .limit(1);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const row = ((data ?? []) as UserProgressRow[])[0];
  if (!row) {
    return null;
  }

  return mapUserProgressRow(row);
}

/** Progresso de todos os alunos (RLS restringe a leitura completa a admin). */
export async function adminListAllUserProgress(): Promise<UserProgress[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .order('last_accessed_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as UserProgressRow[]).map(mapUserProgressRow);
}

export async function listUserProgress(userId: EntityId): Promise<UserProgress[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as UserProgressRow[]).map(mapUserProgressRow);
}

export async function createUserProgress(input: {
  userId: EntityId;
  programId: EntityId;
  startedAt: string;
}): Promise<UserProgress> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const now = input.startedAt;

  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: input.userId,
      program_id: input.programId,
      completed_lesson_ids: [],
      percent_complete: 0,
      last_accessed_at: now,
      started_at: now,
    })
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapUserProgressRow(data as UserProgressRow);
}

export async function updateUserProgress(progress: UserProgress): Promise<UserProgress> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .update(mapUserProgressToUpdate(progress))
    .eq('id', progress.id)
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapUserProgressRow(data as UserProgressRow);
}

export async function upsertUserProgress(progress: UserProgress): Promise<UserProgress> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      {
        id: progress.id,
        user_id: progress.userId,
        program_id: progress.programId,
        ...mapUserProgressToUpdate(progress),
      },
      { onConflict: 'user_id,program_id' },
    )
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapUserProgressRow(data as UserProgressRow);
}
