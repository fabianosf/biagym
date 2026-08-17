import type { Lesson, ProgramDetail } from '@/domain/program';
import type { UserProgress } from '@/domain/progress';

export function flattenLessons(detail: ProgramDetail): Lesson[] {
  return detail.weeks.flatMap(({ lessons }) => lessons);
}

export function getAccessibleLessons(
  detail: ProgramDetail,
  hasFullAccess: boolean,
): Lesson[] {
  return flattenLessons(detail).filter(
    (lesson) => hasFullAccess || lesson.isFreePreview,
  );
}

export function getContinueLesson(
  detail: ProgramDetail,
  progress: UserProgress | null,
  hasFullAccess: boolean,
): Lesson | null {
  const accessibleLessons = getAccessibleLessons(detail, hasFullAccess);
  const completedIds = new Set(progress?.completedLessonIds ?? []);

  if (progress?.lastLessonId) {
    const lastLesson = accessibleLessons.find(
      (lesson) => lesson.id === progress.lastLessonId,
    );

    if (lastLesson && !completedIds.has(lastLesson.id)) {
      return lastLesson;
    }
  }

  for (const lesson of accessibleLessons) {
    if (!completedIds.has(lesson.id)) {
      return lesson;
    }
  }

  return null;
}

export function getLastAccessedLesson(
  detail: ProgramDetail,
  progress: UserProgress | null,
  hasFullAccess: boolean,
): Lesson | null {
  if (!progress?.lastLessonId) {
    return null;
  }

  return (
    getAccessibleLessons(detail, hasFullAccess).find(
      (lesson) => lesson.id === progress.lastLessonId,
    ) ?? null
  );
}

export function countAccessibleLessons(
  detail: ProgramDetail,
  hasFullAccess: boolean,
): number {
  return getAccessibleLessons(detail, hasFullAccess).length;
}

export function countCompletedAccessibleLessons(
  detail: ProgramDetail,
  completedLessonIds: readonly string[],
  hasFullAccess: boolean,
): number {
  const accessibleIds = new Set(
    getAccessibleLessons(detail, hasFullAccess).map((lesson) => lesson.id),
  );

  return completedLessonIds.filter((id) => accessibleIds.has(id)).length;
}

export type LessonStatus = 'completed' | 'in_progress' | 'not_started' | 'locked';

export function getLessonStatus(
  lesson: Lesson,
  completedLessonIds: readonly string[],
  hasFullAccess: boolean,
  activeLessonId?: string,
): LessonStatus {
  const isLocked = !hasFullAccess && !lesson.isFreePreview;

  if (isLocked) {
    return 'locked';
  }

  if (completedLessonIds.includes(lesson.id)) {
    return 'completed';
  }

  if (activeLessonId === lesson.id) {
    return 'in_progress';
  }

  return 'not_started';
}
