import type { StudentGoal, StudentProfile } from '@/domain/student';

import { getDisplayPersonName } from '@/shared/utils/person-name';

import type { ProfileRow } from '../supabase/types';

const VALID_GOALS: readonly StudentGoal[] = [
  'emagrecimento',
  'hipertrofia',
  'condicionamento',
  'saude',
  'mobilidade',
];

export function parseStudentGoal(value: unknown): StudentGoal | null {
  return VALID_GOALS.includes(value as StudentGoal) ? (value as StudentGoal) : null;
}

export function mapProfileRowToStudentProfile(
  row: Pick<
    ProfileRow,
    | 'id'
    | 'name'
    | 'email'
    | 'weight_kg'
    | 'height_cm'
    | 'age'
    | 'goal'
    | 'onboarding_completed_at'
    | 'phone'
  > & { avatar_url?: string | null },
): StudentProfile {
  const goal = parseStudentGoal(row.goal);
  const hasMetrics =
    row.weight_kg != null && row.height_cm != null && row.age != null && goal !== null;

  return {
    userId: row.id,
    name: getDisplayPersonName(row.name) ?? row.name,
    email: row.email,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone?.trim() || undefined,
    metrics: hasMetrics
      ? {
          weightKg: Number(row.weight_kg),
          heightCm: Number(row.height_cm),
          age: Number(row.age),
          goal,
        }
      : null,
    onboardingCompleted: Boolean(row.onboarding_completed_at),
  };
}
