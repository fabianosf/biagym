import type { EntityId, Timestamps } from '../shared';

export type UserRole = 'student' | 'admin';

export interface User extends Timestamps {
  readonly id: EntityId;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly avatarUrl?: string;
}

export type UserProfile = Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatarUrl'>;

export interface UserRef {
  readonly id: EntityId;
  readonly name: string;
  readonly email: string;
}

/** Subconjunto público do usuário para listagens e cabeçalhos. */
export interface PublicUser {
  readonly id: EntityId;
  readonly name: string;
  readonly avatarUrl?: string;
}
