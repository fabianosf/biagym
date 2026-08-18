import type { UserRef } from '@/domain';
import type { StudentProfile } from '@/domain/student';
import { getDisplayPersonName } from '@/shared/utils/person-name';
import { normalizeWhatsAppPhone } from '@/shared/utils/phone';

import {
  assertSupabaseConfigured,
  DataServiceError,
  escapePostgrestPattern,
  mapSupabaseDataError,
} from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { ProfileRow } from '../supabase/types';
import { mapProfileRowToStudentProfile } from './student.mapper';

const STUDENT_PROFILE_COLUMNS =
  'id, name, email, avatar_url, phone, weight_kg, height_cm, age, goal, onboarding_completed_at';
const STUDENT_PROFILE_COLUMNS_NO_PHONE =
  'id, name, email, avatar_url, weight_kg, height_cm, age, goal, onboarding_completed_at';

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    error?.code === 'PGRST204'
  );
}

export async function searchStudents(query: string): Promise<UserRef[]> {
  const profiles = await searchStudentProfiles(query);
  return profiles.map((profile) => ({
    id: profile.userId,
    name: profile.name,
    email: profile.email,
  }));
}

export async function searchStudentProfiles(query: string): Promise<StudentProfile[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  return listStudentProfiles({ search: trimmed, limit: 20 });
}

export async function listStudentProfiles(options?: {
  search?: string;
  limit?: number;
}): Promise<StudentProfile[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const limit = options?.limit ?? 80;
  const search = options?.search?.trim();

  let fullQuery = supabase
    .from('profiles')
    .select(STUDENT_PROFILE_COLUMNS)
    .eq('role', 'student')
    .order('name', { ascending: true })
    .limit(limit);

  if (search) {
    const safeSearch = escapePostgrestPattern(search);
    fullQuery = fullQuery.or(`email.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%`);
  }

  const fullResult = await fullQuery;

  if (fullResult.error && isMissingColumnError(fullResult.error)) {
    let coachingQuery = supabase
      .from('profiles')
      .select(STUDENT_PROFILE_COLUMNS_NO_PHONE)
      .eq('role', 'student')
      .order('name', { ascending: true })
      .limit(limit);

    if (search) {
      const safeSearch = escapePostgrestPattern(search);
      coachingQuery = coachingQuery.or(`email.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%`);
    }

    const coachingResult = await coachingQuery;

    if (!coachingResult.error) {
      return (coachingResult.data ?? []).map((row) =>
        mapProfileRowToStudentProfile(
          row as Parameters<typeof mapProfileRowToStudentProfile>[0],
        ),
      );
    }

    let basicQuery = supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'student')
      .order('name', { ascending: true })
      .limit(limit);

    if (search) {
      const safeSearch = escapePostgrestPattern(search);
      basicQuery = basicQuery.or(`email.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%`);
    }

    const basicResult = await basicQuery;

    if (basicResult.error) {
      throw mapSupabaseDataError(basicResult.error);
    }

    return (basicResult.data ?? []).map((row) => {
      const profile = row as Pick<ProfileRow, 'id' | 'name' | 'email'>;
      return {
        userId: profile.id,
        name: profile.name,
        email: profile.email,
        metrics: null,
        onboardingCompleted: false,
        avatarUrl: undefined,
        phone: undefined,
      };
    });
  }

  if (fullResult.error) {
    throw mapSupabaseDataError(fullResult.error);
  }

  return (fullResult.data ?? []).map((row) =>
    mapProfileRowToStudentProfile(row as Parameters<typeof mapProfileRowToStudentProfile>[0]),
  );
}

export async function getProfilesByIds(userIds: readonly string[]): Promise<Map<string, UserRef>> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', uniqueIds);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const map = new Map<string, UserRef>();
  for (const row of (data ?? []) as Pick<ProfileRow, 'id' | 'name' | 'email'>[]) {
    map.set(row.id, {
      id: row.id,
      name: getDisplayPersonName(row.name) ?? row.name,
      email: row.email,
    });
  }
  return map;
}

export async function getProfileById(userId: string): Promise<UserRef | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (!data) {
    return null;
  }

  const row = data as Pick<ProfileRow, 'id' | 'name' | 'email'>;
  return {
    id: row.id,
    name: getDisplayPersonName(row.name) ?? row.name,
    email: row.email,
  };
}

export async function getStudentProfileById(userId: string): Promise<StudentProfile | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(STUDENT_PROFILE_COLUMNS)
    .eq('id', userId)
    .eq('role', 'student')
    .maybeSingle();

  if (error && isMissingColumnError(error)) {
    const { data: coaching, error: coachingError } = await supabase
      .from('profiles')
      .select(STUDENT_PROFILE_COLUMNS_NO_PHONE)
      .eq('id', userId)
      .eq('role', 'student')
      .maybeSingle();

    if (!coachingError && coaching) {
      return mapProfileRowToStudentProfile(
        coaching as Parameters<typeof mapProfileRowToStudentProfile>[0],
      );
    }

    const { data: basic, error: basicError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', userId)
      .eq('role', 'student')
      .maybeSingle();

    if (basicError) {
      throw mapSupabaseDataError(basicError);
    }

    if (!basic) {
      return null;
    }

    const row = basic as Pick<ProfileRow, 'id' | 'name' | 'email'>;
    return {
      userId: row.id,
      name: getDisplayPersonName(row.name) ?? row.name,
      email: row.email,
      metrics: null,
      onboardingCompleted: false,
      phone: undefined,
    };
  }

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (!data) {
    return null;
  }

  return mapProfileRowToStudentProfile(data as Parameters<typeof mapProfileRowToStudentProfile>[0]);
}

export async function updateOwnProfilePhone(userId: string, phone: string): Promise<string> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    throw new DataServiceError(
      'validation_error',
      undefined,
      'WhatsApp inválido. Use DDD + número.',
    );
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('profiles').update({ phone: normalized }).eq('id', userId);

  if (error && isMissingColumnError(error)) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { phone: normalized },
    });
    if (metadataError) {
      throw mapSupabaseDataError(metadataError);
    }
    return normalized;
  }

  if (error) {
    throw mapSupabaseDataError(error);
  }

  await supabase.auth.updateUser({ data: { phone: normalized } });
  return normalized;
}
