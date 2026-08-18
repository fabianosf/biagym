import type { EntityId, UserProgress } from '@/domain';
import type { CompleteLessonInput, TouchLessonAccessInput } from '@/domain/progress';
import { mergeRemoteProgress } from '@/domain/progress';

import { isOnline } from '../network/connectivity.service';
import { captureException } from '../observability/sentry.service';
import {
  buildLocalLessonAccessRecord,
  buildLocalProgressRecord,
  getProgramProgress,
  markLessonComplete,
  touchLessonAccess,
} from '../progress/progress.service';
import { countLessonsByProgramId, countLessonsByProgramIds } from '../programs/program.repository';
import { DataServiceError } from '../shared';
import {
  appendCompletionHistoryEntry,
  createPendingActionId,
  enqueuePendingProgressAction,
  getCachedProgramProgress,
  getNextClientSequence,
  listCachedProgramProgress,
  listCompletionHistory,
  listPendingProgressActions,
  removePendingProgressAction,
  setCachedProgramProgress,
  type PendingProgressAction,
} from './progress-local.storage';

export type MarkLessonCompleteResult = {
  progress: UserProgress;
  syncState: 'synced' | 'queued';
};

export type TouchLessonAccessResult = {
  progress: UserProgress;
  syncState: 'synced' | 'queued';
};

export type SyncProgressResult = {
  syncedCount: number;
  failedCount: number;
  pendingCount: number;
};

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof DataServiceError)) {
    return false;
  }

  return error.code === 'network_error' || error.code === 'timeout_error';
}

export async function getMergedProgramProgress(
  userId: EntityId,
  programId: EntityId,
): Promise<UserProgress | null> {
  const cached = await getCachedProgramProgress(userId, programId);
  const online = await isOnline();

  if (!online) {
    return cached;
  }

  try {
    const remote = await getProgramProgress(userId, programId);

    if (!remote && !cached) {
      return null;
    }

    if (!remote) {
      return cached;
    }

    if (!cached) {
      await setCachedProgramProgress(remote);
      return remote;
    }

    const totalLessons = await countLessonsByProgramId(programId);
    const merged = mergeRemoteProgress(cached, remote, totalLessons);
    await setCachedProgramProgress(merged);
    return merged;
  } catch {
    return cached;
  }
}

export async function listMergedUserProgress(userId: EntityId): Promise<UserProgress[]> {
  const cachedItems = await listCachedProgramProgress(userId);
  const cachedMap = new Map(cachedItems.map((item) => [item.programId, item]));
  const online = await isOnline();

  if (!online) {
    return cachedItems;
  }

  try {
    const { listUserProgress } = await import('../progress/progress.repository');
    const remoteItems = await listUserProgress(userId);
    const mergedItems: UserProgress[] = [];

    const remoteByProgramId = new Map(remoteItems.map((item) => [item.programId, item]));
    const programIds = [...new Set([...cachedItems.map((item) => item.programId), ...remoteByProgramId.keys()])];
    const lessonCountByProgramId = await countLessonsByProgramIds(programIds);

    for (const programId of programIds) {
      const cached = cachedMap.get(programId) ?? null;
      const remote = remoteByProgramId.get(programId) ?? null;

      if (!cached && !remote) {
        continue;
      }

      if (!remote) {
        mergedItems.push(cached!);
        continue;
      }

      if (!cached) {
        await setCachedProgramProgress(remote);
        mergedItems.push(remote);
        continue;
      }

      const totalLessons = lessonCountByProgramId.get(programId) ?? 0;
      const merged = mergeRemoteProgress(cached, remote, totalLessons);
      await setCachedProgramProgress(merged);
      mergedItems.push(merged);
    }

    return mergedItems.sort((a, b) => b.lastAccessedAt.localeCompare(a.lastAccessedAt));
  } catch {
    return cachedItems;
  }
}

export async function markLessonCompleteWithSync(
  input: CompleteLessonInput,
): Promise<MarkLessonCompleteResult> {
  const existing = await getMergedProgramProgress(input.userId, input.programId);
  const wasAlreadyCompleted = existing?.completedLessonIds.includes(input.lessonId) ?? false;
  const optimistic = buildLocalProgressRecord(input, existing);
  await setCachedProgramProgress(optimistic);

  if (!wasAlreadyCompleted) {
    await appendCompletionHistoryEntry(input.userId, {
      id: createPendingActionId(),
      userId: input.userId,
      programId: input.programId,
      lessonId: input.lessonId,
      completedAt: input.accessedAt,
    });
  }

  const online = await isOnline();

  if (online) {
    try {
      const synced = await markLessonComplete(input);
      await setCachedProgramProgress(synced);
      return { progress: synced, syncState: 'synced' };
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const action: PendingProgressAction = {
    id: createPendingActionId(),
    type: 'complete_lesson',
    userId: input.userId,
    programId: input.programId,
    lessonId: input.lessonId,
    totalLessons: input.totalLessons,
    accessedAt: input.accessedAt,
    clientSequence: await getNextClientSequence(input.userId),
  };

  await enqueuePendingProgressAction(input.userId, action);
  return { progress: optimistic, syncState: 'queued' };
}

export async function touchLessonAccessWithSync(
  input: TouchLessonAccessInput,
): Promise<TouchLessonAccessResult> {
  const existing = await getMergedProgramProgress(input.userId, input.programId);
  const optimistic = buildLocalLessonAccessRecord(input, existing);
  await setCachedProgramProgress(optimistic);

  const online = await isOnline();

  if (online) {
    try {
      const synced = await touchLessonAccess(input);
      await setCachedProgramProgress(synced);
      return { progress: synced, syncState: 'synced' };
    } catch (error) {
      if (!isNetworkError(error)) {
        throw error;
      }
    }
  }

  const action: PendingProgressAction = {
    id: createPendingActionId(),
    type: 'touch_lesson',
    userId: input.userId,
    programId: input.programId,
    lessonId: input.lessonId,
    accessedAt: input.accessedAt,
    clientSequence: await getNextClientSequence(input.userId),
  };

  await enqueuePendingProgressAction(input.userId, action);
  return { progress: optimistic, syncState: 'queued' };
}

const MAX_SYNC_ATTEMPTS = 5;

export async function syncPendingProgress(userId: EntityId): Promise<SyncProgressResult> {
  const online = await isOnline();

  if (!online) {
    const pending = await listPendingProgressActions(userId);
    return {
      syncedCount: 0,
      failedCount: 0,
      pendingCount: pending.length,
    };
  }

  const pending = await listPendingProgressActions(userId);
  let syncedCount = 0;
  let failedCount = 0;

  for (const action of pending) {
    try {
      if (action.type === 'complete_lesson') {
        const synced = await markLessonComplete({
          userId: action.userId,
          programId: action.programId,
          lessonId: action.lessonId,
          totalLessons: action.totalLessons,
          accessedAt: action.accessedAt,
        });
        await setCachedProgramProgress(synced);
      } else {
        const synced = await touchLessonAccess({
          userId: action.userId,
          programId: action.programId,
          lessonId: action.lessonId,
          accessedAt: action.accessedAt,
        });
        await setCachedProgramProgress(synced);
      }

      await removePendingProgressAction(userId, action.id);
      syncedCount += 1;
    } catch (error) {
      failedCount += 1;
      const attempts = (action.attempts ?? 0) + 1;

      if (attempts >= MAX_SYNC_ATTEMPTS) {
        // Ação presa há várias tentativas — não é mais transitória. Descarta
        // da fila para não travar o sync para sempre e registra para
        // investigação, em vez de tentar de novo indefinidamente.
        captureException(error, { flow: 'progress_sync_giveup', actionId: action.id, attempts });
        await removePendingProgressAction(userId, action.id);
        continue;
      }

      await enqueuePendingProgressAction(userId, { ...action, attempts });
    }
  }

  const remaining = await listPendingProgressActions(userId);
  return {
    syncedCount,
    failedCount,
    pendingCount: remaining.length,
  };
}

export async function getCompletionHistory(userId: EntityId) {
  return listCompletionHistory(userId);
}

export async function countPendingProgressActions(userId: EntityId): Promise<number> {
  const pending = await listPendingProgressActions(userId);
  return pending.length;
}
