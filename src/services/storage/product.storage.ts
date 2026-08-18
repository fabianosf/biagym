import * as FileSystem from 'expo-file-system/legacy';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

export const PRODUCT_IMAGE_BUCKET = 'product-images';

export type UploadProductImageInput = {
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

export async function uploadProductImage(input: UploadProductImageInput): Promise<string> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const extension = resolveExtension(input.mimeType, input.fileName);
  const path = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
  const base64 = await FileSystem.readAsStringAsync(input.fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, base64ToArrayBuffer(base64), {
      contentType: input.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
