import { getAuthErrorMessage } from '@/services/auth/auth.errors';
import { getDataErrorMessage } from '@/services/shared/data.errors';

const TIMEOUT_PATTERNS = ['timeout', 'timed out', 'aborted', 'abort', 'deadline'];

export function getFriendlyErrorMessage(error: unknown): string {
  const authMessage = getAuthErrorMessage(error);
  const dataMessage = getDataErrorMessage(error);

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();

    if (TIMEOUT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
      return 'A operação demorou demais. Verifique sua conexão e tente novamente.';
    }
  }

  if (authMessage !== 'Não foi possível concluir a operação. Tente novamente.') {
    return authMessage;
  }

  return dataMessage;
}

export function isNetworkRelatedError(error: unknown): boolean {
  const message = getFriendlyErrorMessage(error).toLowerCase();
  return (
    message.includes('conexão') ||
    message.includes('internet') ||
    message.includes('offline') ||
    message.includes('demorou demais')
  );
}
