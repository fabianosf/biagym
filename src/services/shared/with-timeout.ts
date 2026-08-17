import { DataServiceError } from './data.errors';

export const DATA_FETCH_TIMEOUT_MS = 12_000;
export const CONNECTIVITY_TIMEOUT_MS = 3_000;

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DATA_FETCH_TIMEOUT_MS,
  message?: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new DataServiceError('timeout_error', undefined, message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
