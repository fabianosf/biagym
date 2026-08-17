import type { UserRole } from '../user';

/** Único e-mail autorizado a ver e usar a área administrativa. */
export const AUTHORIZED_ADMIN_EMAIL = 'fabiano.freitas@gmail.com';

export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL;
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isStudent(role: UserRole): boolean {
  return role === 'student';
}

export function canAccessAdminArea(
  role: UserRole,
  email: string | null | undefined,
): boolean {
  return isAdmin(role) && isAuthorizedAdminEmail(email);
}

export function canSeeAdminEntry(email: string | null | undefined): boolean {
  return isAuthorizedAdminEmail(email);
}

export function canGrantProgramAccess(
  role: UserRole,
  email: string | null | undefined,
): boolean {
  return canAccessAdminArea(role, email);
}
