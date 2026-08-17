import type { AccessGrant, EntityId } from '@/domain';

import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { AccessGrantRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapAccessGrantRow,
  mapSupabaseDataError,
} from '../shared';

export async function listAccessGrantsByUserId(userId: EntityId): Promise<AccessGrant[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('access_grants')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as AccessGrantRow[]).map(mapAccessGrantRow);
}

export async function listActiveProgramIdsByUserId(userId: EntityId): Promise<string[]> {
  const grants = await listAccessGrantsByUserId(userId);
  const now = new Date().toISOString();

  return grants
    .filter((grant) => !grant.expiresAt || grant.expiresAt > now)
    .map((grant) => grant.programId);
}

export async function createAccessGrant(input: {
  userId: EntityId;
  programId: EntityId;
  grantedBy: EntityId;
  expiresAt?: string;
}): Promise<AccessGrant> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const existing = await getAccessGrantByUserAndProgram(input.userId, input.programId);
  if (existing) {
    return existing;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('access_grants')
    .insert({
      user_id: input.userId,
      program_id: input.programId,
      granted_by: input.grantedBy,
      expires_at: input.expiresAt ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return mapAccessGrantRow(data as AccessGrantRow);
}

export async function listAccessGrantsByProgramId(
  programId: EntityId,
): Promise<AccessGrant[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('access_grants')
    .select('*')
    .eq('program_id', programId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as AccessGrantRow[]).map(mapAccessGrantRow);
}

export async function revokeAccessGrant(grantId: EntityId): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('access_grants').delete().eq('id', grantId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function getAccessGrantByUserAndProgram(
  userId: EntityId,
  programId: EntityId,
): Promise<AccessGrant | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('access_grants')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .order('granted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (!data) {
    return null;
  }

  return mapAccessGrantRow(data as AccessGrantRow);
}
