import * as FileSystem from 'expo-file-system/legacy';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

export const BODY_PROGRESS_BUCKET = 'body-progress';
export const BODY_PROGRESS_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type UploadBodyPhotoInput = {
  userId: string;
  fileUri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function resolveExtension(mimeType?: string | null, fileName?: string | null): string {
  if (fileName?.includes('.')) {
    return fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
  }

  if (mimeType?.includes('png')) {
    return 'png';
  }

  if (mimeType?.includes('webp')) {
    return 'webp';
  }

  return 'jpg';
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

export async function uploadBodyPhoto(input: UploadBodyPhotoInput): Promise<string> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const extension = resolveExtension(input.mimeType, input.fileName);
  const path = `${input.userId}/${Date.now()}.${extension}`;
  const base64 = await FileSystem.readAsStringAsync(input.fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(BODY_PROGRESS_BUCKET).upload(path, base64ToArrayBuffer(base64), {
    contentType: input.mimeType ?? 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const { data } = supabase.storage.from(BODY_PROGRESS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function extractBodyPhotoPath(photoUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BODY_PROGRESS_BUCKET}/`;
  const index = photoUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(photoUrl.slice(index + marker.length));
}

/**
 * Resolve o valor gravado em body_logs.photo_url para uma URL assinada de
 * curta duração, apta a exibir mesmo com o bucket body-progress privado (ver
 * supabase/private-storage-buckets.sql). Resolve em lote (1 chamada para N
 * fotos) para não introduzir N+1 ao listar o histórico de evolução.
 */
export async function getBodyPhotoPlayableUrls(
  storedUrls: readonly (string | null | undefined)[],
): Promise<(string | undefined)[]> {
  const paths = storedUrls.map((url) => (url ? extractBodyPhotoPath(url) : null));
  const pathsToResolve = [...new Set(paths.filter((path): path is string => Boolean(path)))];

  if (pathsToResolve.length === 0) {
    return storedUrls.map((url) => url ?? undefined);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(BODY_PROGRESS_BUCKET)
    .createSignedUrls(pathsToResolve, BODY_PROGRESS_SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return storedUrls.map((url) => url ?? undefined);
  }

  const signedByPath = new Map(data.map((item) => [item.path, item.signedUrl]));

  return storedUrls.map((url, index) => {
    const path = paths[index];
    if (!path) {
      return url ?? undefined;
    }
    return signedByPath.get(path) ?? url ?? undefined;
  });
}
