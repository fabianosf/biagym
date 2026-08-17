import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { WeekRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapSupabaseDataError,
  mapWeekRow,
} from '../shared';
import type { CreateWeekInput, UpdateWeekInput, Week } from '@/domain/program';

export async function listWeeksByProgramId(programId: string): Promise<Week[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('program_id', programId)
    .order('week_number', { ascending: true });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as WeekRow[]).map(mapWeekRow);
}

export async function createWeek(input: CreateWeekInput): Promise<Week> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('weeks')
    .insert({
      program_id: input.programId,
      week_number: input.weekNumber,
      title: input.title ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapWeekRow(data as WeekRow);
}

export async function updateWeek(weekId: string, input: UpdateWeekInput): Promise<Week> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('weeks')
    .update({
      week_number: input.weekNumber,
      title: input.title,
    })
    .eq('id', weekId)
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapWeekRow(data as WeekRow);
}

export async function deleteWeek(weekId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('weeks').delete().eq('id', weekId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
