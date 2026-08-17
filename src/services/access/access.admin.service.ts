import type { AccessGrant, EntityId, UserRef } from '@/domain';
import type { CreateAccessGrantInput } from '@/domain/progress';

import { getProfileById, searchStudents } from '../users/profile.repository';
import {
  createAccessGrant,
  listAccessGrantsByProgramId,
  listAccessGrantsByUserId,
  revokeAccessGrant,
} from './access.repository';

export type AccessGrantWithUser = AccessGrant & {
  user: UserRef;
};

export async function adminSearchStudents(query: string): Promise<UserRef[]> {
  return searchStudents(query);
}

export async function adminGrantProgramAccess(
  input: CreateAccessGrantInput,
): Promise<AccessGrant> {
  return createAccessGrant({
    userId: input.userId,
    programId: input.programId,
    grantedBy: input.grantedBy,
    expiresAt: input.expiresAt,
  });
}

export async function adminRevokeAccessGrant(grantId: EntityId): Promise<void> {
  return revokeAccessGrant(grantId);
}

export async function adminListProgramAccessGrants(
  programId: EntityId,
): Promise<AccessGrantWithUser[]> {
  const grants = await listAccessGrantsByProgramId(programId);
  const users = await Promise.all(
    grants.map(async (grant) => {
      const user = await getProfileById(grant.userId);
      return {
        ...grant,
        user: user ?? { id: grant.userId, name: 'Aluno', email: '—' },
      };
    }),
  );

  return users;
}

export async function adminListStudentGrants(userId: EntityId): Promise<AccessGrant[]> {
  return listAccessGrantsByUserId(userId);
}
