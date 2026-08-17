import type { UserRole } from './types';

export interface CreateUserInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: UserRole;
}

export interface UpdateUserInput {
  readonly name?: string;
  readonly email?: string;
  readonly avatarUrl?: string | null;
  readonly role?: UserRole;
}

export interface UpdateUserProfileInput {
  readonly name?: string;
  readonly avatarUrl?: string | null;
}
