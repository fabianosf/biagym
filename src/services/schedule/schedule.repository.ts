import type { CreateTrainingSlotInput, TrainingSlot } from '@/domain/schedule';

import { assertSupabaseConfigured, DataServiceError, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { TrainingCheckinRow, TrainingSlotRow } from '../supabase/types';
import { mapTrainingSlotRow } from './schedule.mapper';

function isCoachingSchemaMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('training_slots') ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    error.code === 'PGRST205' ||
    error.code === '42P01'
  );
}

function toTimeValue(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

export async function listTrainingSlots(studentUserId?: string): Promise<TrainingSlot[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  let query = supabase
    .from('training_slots')
    .select('*')
    .order('weekday', { ascending: true })
    .order('start_time', { ascending: true });

  if (studentUserId) {
    query = query.eq('student_user_id', studentUserId);
  }

  const { data, error } = await query;

  if (error) {
    if (isCoachingSchemaMissing(error)) {
      return [];
    }
    throw mapSupabaseDataError(error);
  }

  return withTodayCheckins(((data ?? []) as TrainingSlotRow[]).map(mapTrainingSlotRow));
}

export async function createTrainingSlot(input: CreateTrainingSlotInput): Promise<TrainingSlot> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_slots')
    .insert({
      student_user_id: input.studentUserId,
      weekday: input.weekday,
      start_time: toTimeValue(input.startTime),
      duration_minutes: input.durationMinutes,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      program_id: input.programId ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error || !data) {
    if (error && isCoachingSchemaMissing(error)) {
      throw new DataServiceError(
        'configuration_error',
        error,
        'Recursos de agenda ainda não foram aplicados. Execute supabase/phase12-coaching.sql no SQL Editor.',
      );
    }
    throw mapSupabaseDataError(error ?? { message: 'Falha ao criar horário de treino.' });
  }

  return mapTrainingSlotRow(data as TrainingSlotRow);
}

export async function deleteTrainingSlot(slotId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('training_slots').delete().eq('id', slotId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export function localDateIso(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

async function withTodayCheckins(slots: TrainingSlot[]): Promise<TrainingSlot[]> {
  if (slots.length === 0) {
    return slots;
  }

  const supabase = getSupabaseClient();
  const today = localDateIso();
  const { data, error } = await supabase
    .from('training_checkins')
    .select('*')
    .eq('checkin_date', today)
    .in(
      'slot_id',
      slots.map((slot) => slot.id),
    );

  if (error) {
    return slots;
  }

  const checked = new Set(
    ((data ?? []) as TrainingCheckinRow[]).map((row) => row.slot_id),
  );

  return slots.map((slot) => ({
    ...slot,
    checkedInToday: checked.has(slot.id),
  }));
}

export async function checkInTrainingSlot(input: {
  slotId: string;
  studentUserId: string;
}): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('training_checkins').insert({
    slot_id: input.slotId,
    student_user_id: input.studentUserId,
    checkin_date: localDateIso(),
  });

  if (error) {
    const message = error.message?.toLowerCase() ?? '';
    if (message.includes('duplicate') || error.code === '23505') {
      return;
    }
    throw mapSupabaseDataError(error);
  }
}
