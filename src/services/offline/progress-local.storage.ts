import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CompletionHistoryEntry, UserProgress } from '@/domain/progress';

const PROGRESS_CACHE_PREFIX = '@treinos/progress-cache/';
const PENDING_QUEUE_PREFIX = '@treinos/progress-queue/';
const HISTORY_PREFIX = '@treinos/completion-history/';

export type PendingProgressAction =
  | {
      readonly id: string;
      readonly type: 'complete_lesson';
      readonly userId: string;
      readonly programId: string;
      readonly lessonId: string;
      readonly totalLessons: number;
      readonly accessedAt: string;
      readonly clientSequence: number;
      readonly attempts?: number;
    }
  | {
      readonly id: string;
      readonly type: 'touch_lesson';
      readonly userId: string;
      readonly programId: string;
      readonly lessonId: string;
      readonly accessedAt: string;
      readonly clientSequence: number;
      readonly attempts?: number;
    };

function progressCacheKey(userId: string, programId: string): string {
  return `${PROGRESS_CACHE_PREFIX}${userId}:${programId}`;
}

function pendingQueueKey(userId: string): string {
  return `${PENDING_QUEUE_PREFIX}${userId}`;
}

function historyKey(userId: string): string {
  return `${HISTORY_PREFIX}${userId}`;
}

export async function getCachedProgramProgress(
  userId: string,
  programId: string,
): Promise<UserProgress | null> {
  const raw = await AsyncStorage.getItem(progressCacheKey(userId, programId));
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as UserProgress;
}

export async function setCachedProgramProgress(progress: UserProgress): Promise<void> {
  await AsyncStorage.setItem(
    progressCacheKey(progress.userId, progress.programId),
    JSON.stringify(progress),
  );
}

export async function listCachedProgramProgress(userId: string): Promise<UserProgress[]> {
  const keys = await AsyncStorage.getAllKeys();
  const prefix = `${PROGRESS_CACHE_PREFIX}${userId}:`;
  const progressKeys = keys.filter((key) => key.startsWith(prefix));

  if (progressKeys.length === 0) {
    return [];
  }

  const entries = await AsyncStorage.multiGet(progressKeys);
  return entries
    .map(([, value]) => value)
    .filter((value): value is string => typeof value === 'string')
    .map((value) => JSON.parse(value) as UserProgress);
}

export async function listPendingProgressActions(
  userId: string,
): Promise<PendingProgressAction[]> {
  const raw = await AsyncStorage.getItem(pendingQueueKey(userId));
  if (!raw) {
    return [];
  }

  const actions = JSON.parse(raw) as PendingProgressAction[];
  return [...actions].sort((a, b) => a.clientSequence - b.clientSequence);
}

export async function enqueuePendingProgressAction(
  userId: string,
  action: PendingProgressAction,
): Promise<void> {
  const current = await listPendingProgressActions(userId);
  const next = [...current.filter((item) => item.id !== action.id), action].sort(
    (a, b) => a.clientSequence - b.clientSequence,
  );

  await AsyncStorage.setItem(pendingQueueKey(userId), JSON.stringify(next));
}

export async function removePendingProgressAction(
  userId: string,
  actionId: string,
): Promise<void> {
  const current = await listPendingProgressActions(userId);
  const next = current.filter((item) => item.id !== actionId);
  await AsyncStorage.setItem(pendingQueueKey(userId), JSON.stringify(next));
}

export async function clearPendingProgressActions(userId: string): Promise<void> {
  await AsyncStorage.removeItem(pendingQueueKey(userId));
}

export async function appendCompletionHistoryEntry(
  userId: string,
  entry: CompletionHistoryEntry,
): Promise<void> {
  const current = await listCompletionHistory(userId);
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 30);
  await AsyncStorage.setItem(historyKey(userId), JSON.stringify(next));
}

export async function listCompletionHistory(
  userId: string,
): Promise<CompletionHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(historyKey(userId));
  if (!raw) {
    return [];
  }

  return JSON.parse(raw) as CompletionHistoryEntry[];
}

export async function getNextClientSequence(userId: string): Promise<number> {
  const pending = await listPendingProgressActions(userId);
  const last = pending.at(-1);
  return (last?.clientSequence ?? 0) + 1;
}

export function createPendingActionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
