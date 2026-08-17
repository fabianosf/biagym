import * as FileSystem from 'expo-file-system/legacy';

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

export async function uploadLessonVideo(input: UploadLessonVideoInput): Promise<string> {
  assertSupabaseConfigured(isSupabaseConfigured());

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

  const extension = resolveExtension(input.mimeType, input.fileName);
  const path = `${input.programId}/${input.lessonId}/${Date.now()}.${extension}`;
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${LESSON_VIDEOS_BUCKET}/${encodedPath}`;

  const result = await FileSystem.uploadAsync(uploadUrl, input.fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      'Content-Type': resolveContentType(input.mimeType, input.fileName),
      'x-upsert': 'true',
    },
  });

  if (result.status !== 200 && result.status !== 201) {
    let message = 'Não foi possível enviar o vídeo. Rode supabase/storage.sql e tente um arquivo MP4.';
    try {
      const parsed = JSON.parse(result.body) as { message?: string; error?: string };
      message = parsed.message ?? parsed.error ?? message;
    } catch {
      if (result.body.trim().length > 0) {
        message = result.body;
      }
    }
    throw mapSupabaseDataError({ message });
  }

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
