import type {
  AccessGrant,
  Category,
  Lesson,
  Program,
  ProgramLevel,
  UserProgress,
  Week,
} from '@/domain';

import type {
  AccessGrantRow,
  CategoryRow,
  LessonRow,
  ProgramRow,
  UserProgressRow,
  WeekRow,
} from '../supabase/types';

const PROGRAM_LEVELS: readonly ProgramLevel[] = [
  'iniciante',
  'intermediário',
  'avançado',
];

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseProgramLevel(value: string | null | undefined): ProgramLevel {
  return PROGRAM_LEVELS.includes(value as ProgramLevel) ? (value as ProgramLevel) : 'iniciante';
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name ?? 'Categoria',
    slug: row.slug ?? row.id,
    description: toOptionalString(row.description),
  };
}

export function mapProgramRow(
  row: ProgramRow,
  categoryIds: readonly string[] = [],
): Program {
  return {
    id: row.id,
    title: row.title?.trim() || 'Programa',
    slug: row.slug ?? row.id,
    description: row.description ?? '',
    coverUrl: row.cover_url ?? '',
    trainerName: row.trainer_name?.trim() || 'BiAGym',
    level: parseProgramLevel(row.level),
    durationWeeks: Math.max(0, toFiniteNumber(row.duration_weeks, 0)),
    categoryIds,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWeekRow(row: WeekRow): Week {
  return {
    id: row.id,
    programId: row.program_id,
    weekNumber: Math.max(1, toFiniteNumber(row.week_number, 1)),
    title: toOptionalString(row.title),
  };
}

export function mapLessonRow(row: LessonRow): Lesson {
  return {
    id: row.id,
    programId: row.program_id,
    weekId: row.week_id,
    title: row.title?.trim() || 'Aula',
    description: toOptionalString(row.description),
    videoUrl: row.video_url ?? '',
    durationSeconds: Math.max(0, toFiniteNumber(row.duration_seconds, 0)),
    order: Math.max(0, toFiniteNumber(row.sort_order, 0)),
    isFreePreview: row.is_free_preview || undefined,
  };
}

export function mapUserProgressRow(row: UserProgressRow): UserProgress {
  const completedLessonIds = Array.isArray(row.completed_lesson_ids)
    ? row.completed_lesson_ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    completedLessonIds,
    percentComplete: Math.min(100, Math.max(0, toFiniteNumber(row.percent_complete, 0))),
    lastAccessedAt: row.last_accessed_at ?? row.started_at ?? new Date().toISOString(),
    lastLessonId: toOptionalString(row.last_lesson_id),
    startedAt: row.started_at ?? row.last_accessed_at ?? new Date().toISOString(),
    completedAt: toOptionalString(row.completed_at),
  };
}

export function mapAccessGrantRow(row: AccessGrantRow): AccessGrant {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    expiresAt: toOptionalString(row.expires_at),
  };
}

export function mapProgramToInsert(row: Program) {
  return {
    title: row.title,
    slug: row.slug,
    description: row.description,
    cover_url: row.coverUrl,
    trainer_name: row.trainerName,
    level: row.level,
    duration_weeks: row.durationWeeks,
    is_published: row.isPublished,
  };
}

export function mapUserProgressToUpdate(progress: UserProgress) {
  return {
    completed_lesson_ids: [...progress.completedLessonIds],
    percent_complete: progress.percentComplete,
    last_accessed_at: progress.lastAccessedAt,
    last_lesson_id: progress.lastLessonId ?? null,
    completed_at: progress.completedAt ?? null,
  };
}
