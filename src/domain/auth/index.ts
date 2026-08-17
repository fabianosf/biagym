export type {
  AuthSession,
  AuthState,
  AuthStatus,
  AuthUser,
} from './types';

export type {
  ResetPasswordInput,
  SignInCredentials,
  SignUpInput,
  UpdatePasswordInput,
} from './dto';

export {
  AUTHORIZED_ADMIN_EMAIL,
  canAccessAdminArea,
  canGrantProgramAccess,
  canSeeAdminEntry,
  isAdmin,
  isAuthorizedAdminEmail,
  isStudent,
} from './rules';
