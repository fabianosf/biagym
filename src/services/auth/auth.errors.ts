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

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  configuration_error:
    'Supabase não está configurado. Verifique as variáveis de ambiente.',
  invalid_credentials: 'E-mail ou senha inválidos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  email_taken: 'Este e-mail já está cadastrado.',
  weak_password: 'A senha deve ter pelo menos 6 caracteres.',
  invalid_email: 'Informe um e-mail válido.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
  network_error: 'Erro de conexão. Verifique sua internet e tente novamente.',
  profile_not_found: 'Perfil do usuário não encontrado.',
  unknown: 'Não foi possível concluir a operação. Tente novamente.',
};

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode;
  readonly cause?: unknown;

  constructor(code: AuthErrorCode, cause?: unknown, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = 'AuthServiceError';
    this.code = code;
    this.cause = cause;
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.unknown;
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
