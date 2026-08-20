import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';

export type DataErrorCode =
  | 'configuration_error'
  | 'not_found'
  | 'forbidden'
  | 'validation_error'
  | 'conflict'
  | 'network_error'
  | 'timeout_error'
  | 'unknown';

function defaultDataMessage(code: DataErrorCode): string {
  const locale = usePreferencesStore.getState().locale;
  return translate(locale, `errors.data.${code}`);
}

export class DataServiceError extends Error {
  readonly code: DataErrorCode;
  readonly cause?: unknown;
  /** true quando nenhuma mensagem custom foi passada — traduz sob demanda. */
  readonly hasDefaultMessage: boolean;

  constructor(code: DataErrorCode, cause?: unknown, message?: string) {
    super(message ?? defaultDataMessage(code));
    this.name = 'DataServiceError';
    this.code = code;
    this.cause = cause;
    this.hasDefaultMessage = message === undefined;
  }
}

export function getDataErrorMessage(error: unknown): string {
  if (error instanceof DataServiceError) {
    // Mensagens sem override custom re-traduzem no idioma atual (que pode ter
    // mudado desde a criação do erro); mensagens custom ficam como foram escritas.
    return error.hasDefaultMessage ? defaultDataMessage(error.code) : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultDataMessage('unknown');
}

export function isMissingDatabaseObjectError(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST205' ||
    error.code === 'PGRST202' ||
    error.code === '42P01' ||
    (message.includes('could not find the table') && message.includes('schema cache')) ||
    (message.includes('could not find the function') && message.includes('schema cache')) ||
    (message.includes('relation') && message.includes('does not exist'))
  );
}

export function mapSupabaseDataError(error: {
  code?: string;
  message?: string;
}): DataServiceError {
  const message = error.message?.toLowerCase() ?? '';

  if (
    message.includes('training_plans') ||
    message.includes('workout_exercises') ||
    message.includes('training_plan_grants') ||
    message.includes('workout_sessions') ||
    message.includes('public.exercises')
  ) {
    return new DataServiceError(
      'configuration_error',
      error,
      'As tabelas de Treino A/B/C ainda não existem. Execute supabase/phase13-workouts.sql no SQL Editor.',
    );
  }

  if (isMissingDatabaseObjectError(error)) {
    return new DataServiceError(
      'configuration_error',
      error,
      'O banco ainda não tem as tabelas do app. Execute supabase/schema.sql e supabase/fix-admin.sql no SQL Editor.',
    );
  }

  if (error.code === 'PGRST116' || message.includes('0 rows')) {
    return new DataServiceError('not_found', error);
  }

  if (error.code === '42501' || message.includes('permission denied')) {
    return new DataServiceError('forbidden', error);
  }

  if (error.code === '23505' || message.includes('duplicate')) {
    return new DataServiceError('conflict', error);
  }

  if (message.includes('fetch') || message.includes('network')) {
    return new DataServiceError('network_error', error);
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('abort')
  ) {
    return new DataServiceError('timeout_error', error);
  }

  if (
    message.includes('nutrition_plans') ||
    message.includes('nutrition_meals') ||
    message.includes('training_slots') ||
    message.includes('weight_kg') ||
    message.includes('onboarding_completed_at') ||
    message.includes('claim_coach_role')
  ) {
    return new DataServiceError(
      'configuration_error',
      error,
      'Recursos de coaching ainda não foram aplicados no Supabase. Execute supabase/phase12-coaching.sql e supabase/fix-admin.sql.',
    );
  }

  if (
    error.code === '42703' ||
    (message.includes('column') && message.includes('does not exist')) ||
    message.includes('push_notifications_enabled') ||
    message.includes('expo_push_token')
  ) {
    return new DataServiceError(
      'configuration_error',
      error,
      'Recursos de notificação ainda não foram aplicados no Supabase. Execute supabase/phase10-notifications.sql.',
    );
  }

  return new DataServiceError('unknown', error);
}

export function assertSupabaseConfigured(isConfigured: boolean): void {
  if (!isConfigured) {
    throw new DataServiceError('configuration_error');
  }
}
