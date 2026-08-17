import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';
import { DataServiceError, assertSupabaseConfigured, mapSupabaseDataError } from '../shared';

export type UploadLessonVideoInput = {
  programId: string;
  lessonId: string;
  fileUri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export const LESSON_VIDEOS_BUCKET = 'lesson-videos';
export const VIDEO_UPLOAD_TIMEOUT_MS = 90_000;

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
]);

function resolveExtension(mimeType?: string | null, fileName?: string | null): string {
  if (fileName?.includes('.')) {
    return fileName.split('.').pop()?.toLowerCase() ?? 'mp4';
  }

  if (mimeType?.includes('quicktime')) {
    return 'mov';
  }

  if (mimeType?.includes('webm')) {
    return 'webm';
  }

  return 'mp4';
}

function resolveContentType(mimeType?: string | null, fileName?: string | null): string {
  if (mimeType && ALLOWED_VIDEO_TYPES.has(mimeType)) {
    return mimeType;
  }

  const extension = resolveExtension(mimeType, fileName);
  if (extension === 'mov') {
    return 'video/quicktime';
  }
  if (extension === 'webm') {
    return 'video/webm';
  }
  if (extension === 'm4v') {
    return 'video/x-m4v';
  }

  return 'video/mp4';
}

function throwUploadError(status: number, body: string): never {
  const normalized = body.toLowerCase();
  let message =
    'Não foi possível enviar o vídeo. Rode supabase/storage.sql e tente um arquivo MP4.';

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string; statusCode?: string };
    message = parsed.message ?? parsed.error ?? message;
  } catch {
    if (body.trim().length > 0 && body.trim().length < 400) {
      message = body.trim();
    }
  }

  if (
    status === 401 ||
    status === 403 ||
    normalized.includes('row-level security') ||
    normalized.includes('unauthorized') ||
    normalized.includes('not allowed')
  ) {
    throw new DataServiceError(
      'forbidden',
      { message },
      'O banco bloqueou o upload. Execute supabase/storage.sql e supabase/lock-admin-email.sql, toque em Sou admin e tente de novo.',
    );
  }

  throw mapSupabaseDataError({ message });
}

async function getAccessToken(): Promise<{ accessToken: string; supabaseUrl: string; anonKey: string }> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new DataServiceError('configuration_error');
  }

  const supabase = getSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new DataServiceError('forbidden', undefined, 'Entre novamente para enviar o vídeo.');
  }

  return { accessToken, supabaseUrl, anonKey };
}

async function uploadWithFileSystem(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
  accessToken: string,
  anonKey: string,
): Promise<void> {
  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
  });

  if (result.status !== 200 && result.status !== 201) {
    throwUploadError(result.status, result.body);
  }
}

async function uploadWithStorageClient(
  path: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  if (!response.ok) {
    throw new DataServiceError(
      'unknown',
      undefined,
      'Não foi possível ler o arquivo de vídeo selecionado.',
    );
  }

  const blob = await response.blob();
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(LESSON_VIDEOS_BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  });

  if (error) {
    throwUploadError(400, error.message);
  }
}

export async function uploadLessonVideo(input: UploadLessonVideoInput): Promise<string> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const { accessToken, supabaseUrl, anonKey } = await getAccessToken();
  const extension = resolveExtension(input.mimeType, input.fileName);
  const path = `${input.programId}/${input.lessonId}/${Date.now()}.${extension}`;
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${LESSON_VIDEOS_BUCKET}/${encodedPath}`;
  const contentType = resolveContentType(input.mimeType, input.fileName);

  const uploadTask = (async () => {
    if (Platform.OS !== 'web') {
      try {
        const info = await FileSystem.getInfoAsync(input.fileUri);
        if (!info.exists) {
          throw new DataServiceError(
            'unknown',
            undefined,
            'O arquivo de vídeo não foi encontrado. Selecione de novo.',
          );
        }
      } catch (error) {
        if (error instanceof DataServiceError) {
          throw error;
        }
      }

      try {
        await uploadWithFileSystem(uploadUrl, input.fileUri, contentType, accessToken, anonKey);
        return;
      } catch (error) {
        if (error instanceof DataServiceError && error.code === 'forbidden') {
          throw error;
        }
      }
    }

    await uploadWithStorageClient(path, input.fileUri, contentType);
  })();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      uploadTask,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new DataServiceError(
              'timeout_error',
              undefined,
              'O envio do vídeo demorou demais. Tente um MP4 menor ou verifique a conexão.',
            ),
          );
        }, VIDEO_UPLOAD_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }

  const supabase = getSupabaseClient();
  return supabase.storage.from(LESSON_VIDEOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadExerciseVideo(input: {
  exerciseId: string;
  fileUri: string;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<string> {
  return uploadLessonVideo({
    programId: 'exercises',
    lessonId: input.exerciseId,
    fileUri: input.fileUri,
    mimeType: input.mimeType,
    fileName: input.fileName,
  });
}

export async function deleteLessonVideoByUrl(videoUrl: string): Promise<void> {
  if (!videoUrl || videoUrl === 'pending-upload') {
    return;
  }

  const marker = `/storage/v1/object/public/${LESSON_VIDEOS_BUCKET}/`;
  const index = videoUrl.indexOf(marker);

  if (index === -1) {
    return;
  }

  const path = decodeURIComponent(videoUrl.slice(index + marker.length));
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(LESSON_VIDEOS_BUCKET).remove([path]);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
