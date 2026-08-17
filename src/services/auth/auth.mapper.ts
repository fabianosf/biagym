import type { AuthSession, AuthUser, StudentBodyMetrics, StudentGoal, UserRole } from '@/domain';
import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';

import { getDisplayPersonName } from '@/shared/utils/person-name';

import type { ProfileRow } from '../supabase/types';

const DEFAULT_ROLE: UserRole = 'student';
const VALID_GOALS: readonly StudentGoal[] = [
  'emagrecimento',
  'hipertrofia',
  'condicionamento',
  'saude',
  'mobilidade',
];

export type AuthUserMetadata = {
  name?: string;
  full_name?: string;
  role?: UserRole;
  avatar_url?: string;
  onboarding_completed?: boolean;
  weight_kg?: number;
  height_cm?: number;
  age?: number;
  goal?: StudentGoal | string;
  phone?: string;
};

function parseRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : DEFAULT_ROLE;
}

function parseGoal(value: unknown): StudentGoal | null {
  return VALID_GOALS.includes(value as StudentGoal) ? (value as StudentGoal) : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function extractMetadataMetrics(user: SupabaseAuthUser): StudentBodyMetrics | null {
  const metadata = (user.user_metadata ?? {}) as AuthUserMetadata;
  const goal = parseGoal(metadata.goal);
  const weightKg = parseNumber(metadata.weight_kg);
  const heightCm = parseNumber(metadata.height_cm);
  const age = parseNumber(metadata.age);

  if (weightKg == null || heightCm == null || age == null || goal == null) {
    return null;
  }

  return { weightKg, heightCm, age, goal };
}

function mergeBodyMetrics(
  profile: ProfileRow | null | undefined,
  authUser?: SupabaseAuthUser,
): StudentBodyMetrics | null {
  const metadata = (authUser?.user_metadata ?? {}) as AuthUserMetadata;
  const goal = parseGoal(profile?.goal) ?? parseGoal(metadata.goal);
  const weightKg = parseNumber(profile?.weight_kg) ?? parseNumber(metadata.weight_kg);
  const heightCm = parseNumber(profile?.height_cm) ?? parseNumber(metadata.height_cm);
  const age = parseNumber(profile?.age) ?? parseNumber(metadata.age);

  if (weightKg == null || heightCm == null || age == null || goal == null) {
    return null;
  }

  return { weightKg, heightCm, age, goal };
}

function metadataOnboardingCompleted(user: SupabaseAuthUser): boolean {
  const metadata = (user.user_metadata ?? {}) as AuthUserMetadata;
  return metadata.onboarding_completed === true || extractMetadataMetrics(user) !== null;
}

function mapProfileToAuthUser(profile: ProfileRow, authUser?: SupabaseAuthUser): AuthUser {
  const schemaPending = profile.onboarding_completed_at === 'schema-pending';
  const metadata = (authUser?.user_metadata ?? {}) as AuthUserMetadata;

  return {
    id: profile.id,
    email: profile.email,
    name:
      getDisplayPersonName(profile.name, metadata.name, metadata.full_name) ?? '',
    role: profile.role,
    avatarUrl: profile.avatar_url ?? undefined,
    phone: profile.phone?.trim() || metadata.phone || undefined,
    bodyMetrics: mergeBodyMetrics(profile, authUser),
    onboardingCompleted:
      profile.role === 'admin' ||
      Boolean(profile.onboarding_completed_at && !schemaPending) ||
      Boolean(authUser && metadataOnboardingCompleted(authUser)),
  };
}

function mapMetadataToAuthUser(user: SupabaseAuthUser): AuthUser {
  const metadata = (user.user_metadata ?? {}) as AuthUserMetadata;
  const name = getDisplayPersonName(metadata.name, metadata.full_name) ?? '';

  return {
    id: user.id,
    email: user.email ?? '',
    name,
    role: parseRole(metadata.role),
    avatarUrl: metadata.avatar_url,
    phone: metadata.phone,
    bodyMetrics: extractMetadataMetrics(user),
    onboardingCompleted:
      parseRole(metadata.role) === 'admin' || metadataOnboardingCompleted(user),
  };
}

export function mapSupabaseUserToAuthUser(
  user: SupabaseAuthUser,
  profile?: ProfileRow | null,
): AuthUser {
  if (profile) {
    return mapProfileToAuthUser(profile, user);
  }

  return mapMetadataToAuthUser(user);
}

export function mapSupabaseSessionToAuthSession(
  session: Session,
  user: AuthUser,
): AuthSession {
  return {
    user,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : undefined,
  };
}
