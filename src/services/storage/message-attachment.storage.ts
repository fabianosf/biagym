import * as FileSystem from 'expo-file-system/legacy';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

export const MESSAGE_ATTACHMENT_BUCKET = 'message-attachments';
export const MESSAGE_ATTACHMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type UploadMessageAttachmentInput = {
  studentUserId: string;
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

/**
 * Retorna o caminho salvo no banco (não a URL pública — o bucket é privado).
 * A exibição resolve uma URL assinada sob demanda via getMessageAttachmentPlayableUrl.
 */
export async function uploadMessageAttachment(
  input: UploadMessageAttachmentInput,
): Promise<string> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const extension = resolveExtension(input.mimeType, input.fileName);
  const path = `${input.studentUserId}/${Date.now()}.${extension}`;
  const base64 = await FileSystem.readAsStringAsync(input.fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(MESSAGE_ATTACHMENT_BUCKET)
    .upload(path, base64ToArrayBuffer(base64), {
      contentType: input.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return path;
}

/**
 * Resolve em lote os caminhos salvos em coach_messages.attachment_url para
 * URLs assinadas de curta duração — mesma estratégia de body.storage.ts, pra
 * não gerar 1 chamada de rede por mensagem ao abrir uma conversa.
 */
export async function getMessageAttachmentPlayableUrls(
  paths: readonly (string | null | undefined)[],
): Promise<(string | undefined)[]> {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];

  if (uniquePaths.length === 0) {
    return paths.map(() => undefined);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(MESSAGE_ATTACHMENT_BUCKET)
    .createSignedUrls(uniquePaths, MESSAGE_ATTACHMENT_SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return paths.map(() => undefined);
  }

  const signedByPath = new Map(data.map((item) => [item.path, item.signedUrl]));

  return paths.map((path) => (path ? (signedByPath.get(path) ?? undefined) : undefined));
}
