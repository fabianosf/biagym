import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { resolveLessonVideoPlayableUrl } from '../storage/video.storage';

const DOWNLOADS_MANIFEST_KEY = '@treinos/lesson-downloads';

export type LessonDownloadRecord = {
  readonly lessonId: string;
  readonly programId: string;
  readonly remoteUrl: string;
  readonly localUri: string;
  readonly downloadedAt: string;
  readonly fileSizeBytes?: number;
};

export type LessonDownloadProgress = {
  readonly lessonId: string;
  readonly progress: number;
};

type DownloadProgressListener = (update: LessonDownloadProgress) => void;

const activeDownloads = new Map<string, Promise<string>>();
const progressListeners = new Map<string, Set<DownloadProgressListener>>();

function getDownloadDirectory(programId: string): string {
  return `${FileSystem.documentDirectory}lesson-videos/${programId}/`;
}

function getDownloadFileUri(programId: string, lessonId: string, extension = 'mp4'): string {
  return `${getDownloadDirectory(programId)}${lessonId}.${extension}`;
}

function resolveExtensionFromUrl(url: string): string {
  const cleanUrl = url.split('?')[0] ?? url;
  const extension = cleanUrl.split('.').pop()?.toLowerCase();

  if (extension === 'mov' || extension === 'webm' || extension === 'm4v') {
    return extension;
  }

  return 'mp4';
}

async function readManifest(): Promise<LessonDownloadRecord[]> {
  const raw = await AsyncStorage.getItem(DOWNLOADS_MANIFEST_KEY);
  if (!raw) {
    return [];
  }

  return JSON.parse(raw) as LessonDownloadRecord[];
}

async function writeManifest(records: LessonDownloadRecord[]): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADS_MANIFEST_KEY, JSON.stringify(records));
}

async function fileExists(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}

function emitDownloadProgress(lessonId: string, progress: number): void {
  const listeners = progressListeners.get(lessonId);
  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener({ lessonId, progress });
  }
}

export function subscribeToLessonDownloadProgress(
  lessonId: string,
  listener: DownloadProgressListener,
): () => void {
  const current = progressListeners.get(lessonId) ?? new Set<DownloadProgressListener>();
  current.add(listener);
  progressListeners.set(lessonId, current);

  return () => {
    const listeners = progressListeners.get(lessonId);
    if (!listeners) {
      return;
    }

    listeners.delete(listener);
    if (listeners.size === 0) {
      progressListeners.delete(lessonId);
    }
  };
}

export async function listLessonDownloads(): Promise<LessonDownloadRecord[]> {
  return readManifest();
}

export async function getLessonDownloadRecord(
  lessonId: string,
): Promise<LessonDownloadRecord | null> {
  const records = await readManifest();
  return records.find((record) => record.lessonId === lessonId) ?? null;
}

export async function getLocalLessonVideoUri(lessonId: string): Promise<string | null> {
  const record = await getLessonDownloadRecord(lessonId);
  if (!record) {
    return null;
  }

  if (!(await fileExists(record.localUri))) {
    await removeLessonDownload(lessonId);
    return null;
  }

  return record.localUri;
}

export async function isLessonDownloaded(lessonId: string): Promise<boolean> {
  const uri = await getLocalLessonVideoUri(lessonId);
  return uri !== null;
}

export async function downloadLessonVideo(input: {
  lessonId: string;
  programId: string;
  remoteUrl: string;
}): Promise<string> {
  const existing = activeDownloads.get(input.lessonId);
  if (existing) {
    return existing;
  }

  const task = performDownload(input);
  activeDownloads.set(input.lessonId, task);

  try {
    return await task;
  } finally {
    activeDownloads.delete(input.lessonId);
  }
}

async function performDownload(input: {
  lessonId: string;
  programId: string;
  remoteUrl: string;
}): Promise<string> {
  const directory = getDownloadDirectory(input.programId);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const extension = resolveExtensionFromUrl(input.remoteUrl);
  const localUri = getDownloadFileUri(input.programId, input.lessonId, extension);
  const downloadUrl = await resolveLessonVideoPlayableUrl(input.remoteUrl);

  emitDownloadProgress(input.lessonId, 0);

  const downloadResumable = FileSystem.createDownloadResumable(
    downloadUrl,
    localUri,
    {},
    (downloadProgress) => {
      const totalBytes = downloadProgress.totalBytesExpectedToWrite;
      if (totalBytes <= 0) {
        return;
      }

      emitDownloadProgress(
        input.lessonId,
        downloadProgress.totalBytesWritten / totalBytes,
      );
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error('Falha ao baixar o vídeo da aula.');
  }

  const fileInfo = await FileSystem.getInfoAsync(result.uri);
  const fileSizeBytes =
    fileInfo.exists && 'size' in fileInfo ? fileInfo.size : undefined;

  const record: LessonDownloadRecord = {
    lessonId: input.lessonId,
    programId: input.programId,
    remoteUrl: input.remoteUrl,
    localUri: result.uri,
    downloadedAt: new Date().toISOString(),
    fileSizeBytes,
  };

  const records = await readManifest();
  const next = [
    record,
    ...records.filter((item) => item.lessonId !== input.lessonId),
  ];
  await writeManifest(next);
  emitDownloadProgress(input.lessonId, 1);

  return result.uri;
}

export async function removeLessonDownload(lessonId: string): Promise<void> {
  const records = await readManifest();
  const record = records.find((item) => item.lessonId === lessonId);

  if (record && (await fileExists(record.localUri))) {
    await FileSystem.deleteAsync(record.localUri, { idempotent: true });
  }

  await writeManifest(records.filter((item) => item.lessonId !== lessonId));
}

export async function clearStaleLessonDownloads(maxAgeDays = 30): Promise<number> {
  const records = await readManifest();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let removedCount = 0;
  const kept: LessonDownloadRecord[] = [];

  for (const record of records) {
    const downloadedAt = Date.parse(record.downloadedAt);
    if (Number.isNaN(downloadedAt) || downloadedAt < cutoff) {
      if (await fileExists(record.localUri)) {
        await FileSystem.deleteAsync(record.localUri, { idempotent: true });
      }
      removedCount += 1;
      continue;
    }

    kept.push(record);
  }

  await writeManifest(kept);
  return removedCount;
}

export async function getDownloadedLessonsByProgram(
  programId: string,
): Promise<LessonDownloadRecord[]> {
  const records = await readManifest();
  return records.filter((record) => record.programId === programId);
}
