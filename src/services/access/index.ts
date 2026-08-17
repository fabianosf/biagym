export {
  createAccessGrant,
  getAccessGrantByUserAndProgram,
  listAccessGrantsByProgramId,
  listAccessGrantsByUserId,
  listActiveProgramIdsByUserId,
  revokeAccessGrant,
} from './access.repository';
export {
  adminGrantProgramAccess,
  adminListProgramAccessGrants,
  adminListStudentGrants,
  adminRevokeAccessGrant,
  adminSearchStudents,
} from './access.admin.service';
export type { AccessGrantWithUser } from './access.admin.service';
export {
  assertUserHasProgramAccess,
  getUserAccessGrants,
  grantProgramAccess,
  listAccessiblePrograms,
  userHasProgramAccess,
} from './access.service';
