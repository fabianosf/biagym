import type {
  AccessGrant,
  Category,
  Lesson,
  Program,
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

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
  };
}

export function mapProgramRow(
  row: ProgramRow,
  categoryIds: readonly string[] = [],
): Program {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.cover_url,
    trainerName: row.trainer_name,
    level: row.level,
    durationWeeks: row.duration_weeks,
    categoryIds,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWeekRow(row: WeekRow): Week {
  return {
    id: row.id,
    programId: row.program_id,
    weekNumber: row.week_number,
    title: row.title ?? undefined,
  };
}

export function mapLessonRow(row: LessonRow): Lesson {
  return {
    id: row.id,
    programId: row.program_id,
    weekId: row.week_id,
    title: row.title,
    description: row.description ?? undefined,
    videoUrl: row.video_url,
    durationSeconds: row.duration_seconds,
    order: row.sort_order,
    isFreePreview: row.is_free_preview || undefined,
  };
}

export function mapUserProgressRow(row: UserProgressRow): UserProgress {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    completedLessonIds: row.completed_lesson_ids,
    percentComplete: row.percent_complete,
    lastAccessedAt: row.last_accessed_at,
    lastLessonId: row.last_lesson_id ?? undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export function mapAccessGrantRow(row: AccessGrantRow): AccessGrant {
  return {
    id: row.id,
    userId: row.user_id,
    programId: row.program_id,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at ?? undefined,
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
