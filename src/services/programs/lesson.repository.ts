import type { CreateLessonInput, Lesson, UpdateLessonInput } from '@/domain/program';

import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { LessonRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapLessonRow,
  mapSupabaseDataError,
} from '../shared';

function buildLessonUpdatePayload(input: UpdateLessonInput) {
  const payload: {
    week_id?: string;
    title?: string;
    description?: string | null;
    video_url?: string;
    duration_seconds?: number;
    sort_order?: number;
    is_free_preview?: boolean;
  } = {};

  if (input.weekId !== undefined) {
    payload.week_id = input.weekId;
  }
  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.description !== undefined) {
    payload.description = input.description;
  }
  if (input.videoUrl !== undefined) {
    payload.video_url = input.videoUrl;
  }
  if (input.durationSeconds !== undefined) {
    payload.duration_seconds = input.durationSeconds;
  }
  if (input.order !== undefined) {
    payload.sort_order = input.order;
  }
  if (input.isFreePreview !== undefined) {
    payload.is_free_preview = input.isFreePreview;
  }

  return payload;
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (!data) {
    return null;
  }

  return mapLessonRow(data as LessonRow);
}

export async function listLessonsByProgramId(programId: string): Promise<Lesson[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as LessonRow[]).map(mapLessonRow);
}

export async function createLesson(input: CreateLessonInput): Promise<Lesson> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      program_id: input.programId,
      week_id: input.weekId,
      title: input.title,
      description: input.description ?? null,
      video_url: input.videoUrl,
      duration_seconds: input.durationSeconds,
      sort_order: input.order,
      is_free_preview: input.isFreePreview ?? false,
    })
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapLessonRow(data as LessonRow);
}

export async function updateLesson(
  lessonId: string,
  input: UpdateLessonInput,
): Promise<Lesson> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const payload = buildLessonUpdatePayload(input);

  if (Object.keys(payload).length === 0) {
    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      throw mapSupabaseDataError({ message: 'Registro não encontrado.', code: 'PGRST116' });
    }
    return lesson;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .update(payload)
    .eq('id', lessonId)
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapLessonRow(data as LessonRow);
}

export async function deleteLesson(lessonId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function getNextLessonOrder(weekId: string): Promise<number> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('week_id', weekId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw mapSupabaseDataError(error);
  }

  return data ? (data as { sort_order: number }).sort_order + 1 : 1;
}
