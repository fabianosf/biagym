import type { EntityId, ISODateString } from '../shared';
import type { AccessGrant, ProgressStatus, UserProgress } from './types';

const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

export function clampPercentComplete(value: number): number {
  return Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, Math.round(value)));
}

export function isLessonCompleted(
  progress: UserProgress,
  lessonId: EntityId,
): boolean {
  return progress.completedLessonIds.includes(lessonId);
}

export function calculatePercentComplete(
  completedCount: number,
  totalLessons: number,
): number {
  if (totalLessons <= 0) {
    return PERCENT_MIN;
  }

  return clampPercentComplete((completedCount / totalLessons) * PERCENT_MAX);
}

export function deriveProgressStatus(
  progress: UserProgress | null,
): ProgressStatus {
  if (progress === null) {
    return 'not_started';
  }

  if (progress.completedAt !== undefined) {
    return 'completed';
  }

  if (progress.completedLessonIds.length === 0 && progress.percentComplete === 0) {
    return 'not_started';
  }

  return 'in_progress';
}

export function isAccessGrantActive(
  grant: AccessGrant,
  referenceDate: ISODateString = new Date().toISOString(),
): boolean {
  if (grant.expiresAt === undefined) {
    return true;
  }

  return grant.expiresAt > referenceDate;
}

export function hasProgramAccess(
  grants: readonly AccessGrant[],
  programId: EntityId,
  referenceDate?: ISODateString,
): boolean {
  return grants.some(
    (grant) =>
      grant.programId === programId && isAccessGrantActive(grant, referenceDate),
  );
}

export function mergeCompletedLessonIds(
  progress: UserProgress,
  lessonId: EntityId,
): readonly EntityId[] {
  if (progress.completedLessonIds.includes(lessonId)) {
    return progress.completedLessonIds;
  }

  return [...progress.completedLessonIds, lessonId];
}

export function unionCompletedLessonIds(
  first: readonly EntityId[],
  second: readonly EntityId[],
): readonly EntityId[] {
  return [...new Set([...first, ...second])];
}

export function buildProgressAfterLessonComplete(
  progress: UserProgress,
  lessonId: EntityId,
  totalLessons: number,
  accessedAt: ISODateString,
): UserProgress {
  const completedLessonIds = mergeCompletedLessonIds(progress, lessonId);
  const percentComplete = calculatePercentComplete(
    completedLessonIds.length,
    totalLessons,
  );

  return {
    ...progress,
    completedLessonIds,
    percentComplete,
    lastAccessedAt: accessedAt,
    lastLessonId: lessonId,
    completedAt:
      percentComplete >= PERCENT_MAX ? accessedAt : progress.completedAt,
  };
}

export function buildProgressAfterLessonAccess(
  progress: UserProgress,
  lessonId: EntityId,
  accessedAt: ISODateString,
): UserProgress {
  if (
    progress.lastLessonId === lessonId &&
    progress.lastAccessedAt === accessedAt
  ) {
    return progress;
  }

  return {
    ...progress,
    lastAccessedAt: accessedAt,
    lastLessonId: lessonId,
  };
}

export function mergeRemoteProgress(
  local: UserProgress,
  remote: UserProgress,
  totalLessons: number,
): UserProgress {
  const completedLessonIds = unionCompletedLessonIds(
    local.completedLessonIds,
    remote.completedLessonIds,
  );
  const useLocalTimeline = local.lastAccessedAt >= remote.lastAccessedAt;
  const lastAccessedAt = useLocalTimeline
    ? local.lastAccessedAt
    : remote.lastAccessedAt;
  const lastLessonId = useLocalTimeline
    ? (local.lastLessonId ?? remote.lastLessonId)
    : (remote.lastLessonId ?? local.lastLessonId);
  const percentComplete = calculatePercentComplete(
    completedLessonIds.length,
    totalLessons,
  );
  const completedAt =
    local.completedAt && remote.completedAt
      ? local.completedAt >= remote.completedAt
        ? local.completedAt
        : remote.completedAt
      : (local.completedAt ?? remote.completedAt);

  return {
    ...remote,
    completedLessonIds,
    percentComplete,
    lastAccessedAt,
    lastLessonId,
    completedAt: percentComplete >= PERCENT_MAX ? completedAt : undefined,
  };
}

export function createInitialProgress(
  input: {
    id: EntityId;
    userId: EntityId;
    programId: EntityId;
    startedAt: ISODateString;
  },
): UserProgress {
  return {
    id: input.id,
    userId: input.userId,
    programId: input.programId,
    completedLessonIds: [],
    percentComplete: PERCENT_MIN,
    lastAccessedAt: input.startedAt,
    startedAt: input.startedAt,
  };
}
