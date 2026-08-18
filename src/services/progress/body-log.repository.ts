import type { BodyLog, CreateBodyLogInput } from '@/domain/student';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getBodyPhotoPlayableUrls } from '../storage/body.storage';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { BodyLogRow } from '../supabase/types';

function isMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('body_logs') ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    error.code === 'PGRST205' ||
    error.code === '42P01'
  );
}

function mapBodyLogRow(row: BodyLogRow): BodyLog {
  return {
    id: row.id,
    userId: row.user_id,
    weightKg: Number(row.weight_kg),
    notes: row.notes ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
  };
}

export async function listBodyLogs(userId: string): Promise<BodyLog[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('body_logs')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    if (isMissing(error)) {
      return [];
    }
    throw mapSupabaseDataError(error);
  }

  const rows = (data ?? []) as BodyLogRow[];
  const playablePhotoUrls = await getBodyPhotoPlayableUrls(rows.map((row) => row.photo_url));

  return rows.map((row, index) => ({
    ...mapBodyLogRow(row),
    photoUrl: playablePhotoUrls[index],
  }));
}

export async function createBodyLog(input: CreateBodyLogInput): Promise<BodyLog> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('body_logs')
    .insert({
      user_id: input.userId,
      weight_kg: input.weightKg,
      notes: input.notes?.trim() || null,
      photo_url: input.photoUrl ?? null,
      recorded_at: input.recordedAt ?? new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível salvar a evolução.' });
  }

  await supabase.from('profiles').update({ weight_kg: input.weightKg }).eq('id', input.userId);

  const row = data as BodyLogRow;
  const [playablePhotoUrl] = await getBodyPhotoPlayableUrls([row.photo_url]);

  return { ...mapBodyLogRow(row), photoUrl: playablePhotoUrl };
}
