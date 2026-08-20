import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';

export type AuthErrorCode =
  | 'configuration_error'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_taken'
  | 'weak_password'
  | 'invalid_email'
  | 'session_expired'
  | 'network_error'
  | 'profile_not_found'
  | 'unknown';

function defaultAuthMessage(code: AuthErrorCode): string {
  const locale = usePreferencesStore.getState().locale;
  return translate(locale, `errors.auth.${code}`);
}

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode;
  readonly cause?: unknown;
  /** true quando nenhuma mensagem custom foi passada — traduz sob demanda. */
  readonly hasDefaultMessage: boolean;

  constructor(code: AuthErrorCode, cause?: unknown, message?: string) {
    super(message ?? defaultAuthMessage(code));
    this.name = 'AuthServiceError';
    this.code = code;
    this.cause = cause;
    this.hasDefaultMessage = message === undefined;
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) {
    // Mensagens sem override custom re-traduzem no idioma atual (que pode ter
    // mudado desde a criação do erro); mensagens custom ficam como foram escritas.
    return error.hasDefaultMessage ? defaultAuthMessage(error.code) : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultAuthMessage('unknown');
}

export function mapSupabaseAuthError(error: { message?: string; status?: number }): AuthServiceError {
  const message = error.message?.toLowerCase() ?? '';

  if (message.includes('invalid login credentials')) {
    return new AuthServiceError('invalid_credentials', error);
  }

  if (message.includes('email not confirmed')) {
    return new AuthServiceError('email_not_confirmed', error);
  }

  if (message.includes('user already registered')) {
    return new AuthServiceError('email_taken', error);
  }

  if (message.includes('password') && message.includes('least')) {
    return new AuthServiceError('weak_password', error);
  }

  if (message.includes('valid email')) {
    return new AuthServiceError('invalid_email', error);
  }

  if (message.includes('fetch') || message.includes('network')) {
    return new AuthServiceError('network_error', error);
  }

  if (message.includes('jwt') || message.includes('session')) {
    return new AuthServiceError('session_expired', error);
  }

  return new AuthServiceError('unknown', error);
}
