export {
  getAuthErrorMessage,
  AuthServiceError,
  mapSupabaseAuthError,
} from './auth.errors';
export type { AuthErrorCode } from './auth.errors';
export {
  getCurrentSession,
  getCurrentUser,
  onAuthStateChange,
  promoteCurrentUserToAdmin,
  completeStudentOnboarding,
  requestPasswordReset,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from './auth.service';
