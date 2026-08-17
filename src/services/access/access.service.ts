import type { AccessGrant, EntityId, ProgramSummary } from '@/domain';
import type { CreateAccessGrantInput } from '@/domain/progress';
import { hasProgramAccess, isAccessGrantActive } from '@/domain/progress';

import { listProgramsByIds } from '../programs/program.repository';
import {
  createAccessGrant as createAccessGrantInRepo,
  getAccessGrantByUserAndProgram,
  listAccessGrantsByUserId,
  listActiveProgramIdsByUserId,
} from './access.repository';

export async function getUserAccessGrants(userId: EntityId): Promise<AccessGrant[]> {
  return listAccessGrantsByUserId(userId);
}

export async function userHasProgramAccess(
  userId: EntityId,
  programId: EntityId,
  referenceDate?: string,
): Promise<boolean> {
  const grants = await listAccessGrantsByUserId(userId);
  return hasProgramAccess(grants, programId, referenceDate);
}

export async function assertUserHasProgramAccess(
  userId: EntityId,
  programId: EntityId,
): Promise<AccessGrant | null> {
  const grant = await getAccessGrantByUserAndProgram(userId, programId);

  if (grant && isAccessGrantActive(grant)) {
    return grant;
  }

  const grants = await listAccessGrantsByUserId(userId);

  if (hasProgramAccess(grants, programId)) {
    return grant;
  }

  return null;
}

export async function listAccessiblePrograms(userId: EntityId): Promise<ProgramSummary[]> {
  const programIds = await listActiveProgramIdsByUserId(userId);
  return listProgramsByIds(programIds);
}

export async function grantProgramAccess(
  input: CreateAccessGrantInput,
): Promise<AccessGrant> {
  return createAccessGrantInRepo({
    userId: input.userId,
    programId: input.programId,
    grantedBy: input.grantedBy,
    expiresAt: input.expiresAt,
  });
}
