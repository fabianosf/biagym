import { AuthServiceError, getAuthErrorMessage } from '@/services/auth/auth.errors';
import { DataServiceError, getDataErrorMessage } from '@/services/shared/data.errors';
import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';

const TIMEOUT_PATTERNS = ['timeout', 'timed out', 'aborted', 'abort', 'deadline'];

export function getFriendlyErrorMessage(error: unknown): string {
  const authMessage = getAuthErrorMessage(error);
  const dataMessage = getDataErrorMessage(error);
  const locale = usePreferencesStore.getState().locale;
  const unknownMessage = translate(locale, 'errors.auth.unknown');

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();

    if (TIMEOUT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      return translate(locale, 'errors.data.timeout_error');
    }
  }

  if (authMessage !== unknownMessage) {
    return authMessage;
  }

  return dataMessage;
}

const NETWORK_CODES = new Set(['network_error', 'timeout_error']);

export function isNetworkRelatedError(error: unknown): boolean {
  if (error instanceof AuthServiceError || error instanceof DataServiceError) {
    return NETWORK_CODES.has(error.code);
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    return (
      TIMEOUT_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
      normalized.includes('network') ||
      normalized.includes('fetch') ||
      normalized.includes('offline')
    );
  }

  return false;
}
