import type { EntityId, UserProgress } from '@/domain';
import type { CompleteLessonInput, TouchLessonAccessInput } from '@/domain/progress';
import {
  buildProgressAfterLessonAccess,
  buildProgressAfterLessonComplete,
  createInitialProgress,
} from '@/domain/progress';

import { assertUserHasProgramAccess } from '../access/access.service';
import { getLessonById } from '../programs/program.repository';
import { countLessonsByProgramId } from '../programs/program.repository';
import { DataServiceError } from '../shared';
import {
  createUserProgress,
  getUserProgressByProgram,
  updateUserProgress,
} from './progress.repository';

async function ensureProgressRecord(
  userId: EntityId,
  programId: EntityId,
  accessedAt: string,
): Promise<UserProgress> {
  const existing = await getUserProgressByProgram(userId, programId);

  if (existing) {
    return existing;
  }

  return createUserProgress({
    userId,
    programId,
    startedAt: accessedAt,
  });
}

export async function getProgramProgress(
  userId: EntityId,
  programId: EntityId,
): Promise<UserProgress | null> {
  return getUserProgressByProgram(userId, programId);
}

export async function markLessonComplete(
  input: CompleteLessonInput,
): Promise<UserProgress> {
  const lesson = await getLessonById(input.lessonId);

  if (!lesson) {
    throw new DataServiceError('not_found', undefined, 'Aula não encontrada.');
  }

  if (lesson.programId !== input.programId) {
    throw new DataServiceError('validation_error', undefined, 'Aula não pertence ao programa.');
  }

  const accessGrant = await assertUserHasProgramAccess(input.userId, input.programId);
  const hasFullAccess = accessGrant !== null;

  if (!hasFullAccess && !lesson.isFreePreview) {
    throw new DataServiceError(
      'forbidden',
      undefined,
      'Você não tem acesso a esta aula.',
    );
  }

  const progress = await ensureProgressRecord(
    input.userId,
    input.programId,
    input.accessedAt,
  );

  const totalLessons =
    input.totalLessons > 0
      ? input.totalLessons
      : await countLessonsByProgramId(input.programId);

  const updated = buildProgressAfterLessonComplete(
    progress,
    input.lessonId,
    totalLessons,
    input.accessedAt,
  );

  return updateUserProgress(updated);
}

export async function touchLessonAccess(
  input: TouchLessonAccessInput,
): Promise<UserProgress> {
  const progress = await ensureProgressRecord(
    input.userId,
    input.programId,
    input.accessedAt,
  );

  const updated = buildProgressAfterLessonAccess(
    progress,
    input.lessonId,
    input.accessedAt,
  );

  if (updated.lastAccessedAt === progress.lastAccessedAt) {
    return progress;
  }

  return updateUserProgress(updated);
}

export async function touchProgramProgress(
  userId: EntityId,
  programId: EntityId,
  accessedAt: string,
): Promise<UserProgress> {
  const progress = await ensureProgressRecord(userId, programId, accessedAt);

  if (progress.lastAccessedAt === accessedAt) {
    return progress;
  }

  return updateUserProgress({
    ...progress,
    lastAccessedAt: accessedAt,
  });
}

export function buildLocalProgressRecord(
  input: CompleteLessonInput,
  existing: UserProgress | null,
): UserProgress {
  const base =
    existing ??
    createInitialProgress({
      id: `local-${input.userId}-${input.programId}`,
      userId: input.userId,
      programId: input.programId,
      startedAt: input.accessedAt,
    });

  return buildProgressAfterLessonComplete(
    base,
    input.lessonId,
    input.totalLessons,
    input.accessedAt,
  );
}

export function buildLocalLessonAccessRecord(
  input: TouchLessonAccessInput,
  existing: UserProgress | null,
): UserProgress {
  const base =
    existing ??
    createInitialProgress({
      id: `local-${input.userId}-${input.programId}`,
      userId: input.userId,
      programId: input.programId,
      startedAt: input.accessedAt,
    });

  return buildProgressAfterLessonAccess(base, input.lessonId, input.accessedAt);
}
