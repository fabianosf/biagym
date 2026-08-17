import type { ISODateString } from '../shared';
import type { StudentBodyMetrics } from '../student';
import type { User, UserRole } from '../user';

/** Usuário autenticado com dados mínimos para autorização na sessão. */
export interface AuthUser {
  readonly id: User['id'];
  readonly email: User['email'];
  readonly name: User['name'];
  readonly role: UserRole;
  readonly avatarUrl?: User['avatarUrl'];
  readonly phone?: string;
  readonly bodyMetrics?: StudentBodyMetrics | null;
  readonly onboardingCompleted: boolean;
}

export interface AuthSession {
  readonly user: AuthUser;
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: ISODateString;
}

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  readonly status: AuthStatus;
  readonly session: AuthSession | null;
}
