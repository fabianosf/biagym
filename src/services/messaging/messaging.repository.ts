import type { CoachMessage, SendCoachMessageInput } from '@/domain/messaging';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { CoachMessageRow, ProfileRow } from '../supabase/types';

function isMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('coach_messages') ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    error.code === 'PGRST205' ||
    error.code === '42P01'
  );
}

function mapMessage(
  row: CoachMessageRow,
  names: Map<string, string>,
): CoachMessage {
  return {
    id: row.id,
    studentUserId: row.student_user_id,
    senderId: row.sender_id,
    senderName: names.get(row.sender_id) ?? 'BiAGym',
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export async function listCoachMessages(studentUserId: string): Promise<CoachMessage[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('created_at', { ascending: true })
    .limit(80);

  if (error) {
    if (isMissing(error)) {
      return [];
    }
    throw mapSupabaseDataError(error);
  }

  const rows = (data ?? []) as CoachMessageRow[];
  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const names = new Map<string, string>();

  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', senderIds);

    for (const profile of (profiles ?? []) as Pick<ProfileRow, 'id' | 'name'>[]) {
      names.set(profile.id, profile.name);
    }
  }

  return rows.map((row) => mapMessage(row, names));
}

export async function sendCoachMessage(input: SendCoachMessageInput): Promise<CoachMessage> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('coach_messages')
    .insert({
      student_user_id: input.studentUserId,
      sender_id: input.senderId,
      body: input.body.trim(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível enviar o recado.' });
  }

  const row = data as CoachMessageRow;
  return mapMessage(row, new Map([[input.senderId, 'Você']]));
}

export async function markCoachMessagesRead(studentUserId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('coach_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('student_user_id', studentUserId)
    .is('read_at', null)
    .neq('sender_id', studentUserId);

  if (error && !isMissing(error)) {
    throw mapSupabaseDataError(error);
  }
}
