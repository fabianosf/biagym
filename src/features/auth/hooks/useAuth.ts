import { canAccessAdminArea, canSeeAdminEntry } from '@/domain/auth';
import { useMemo } from 'react';

import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const error = useAuthStore((state) => state.error);
  const infoMessage = useAuthStore((state) => state.infoMessage);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const becomeAdmin = useAuthStore((state) => state.becomeAdmin);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const signOut = useAuthStore((state) => state.signOut);
  const clearError = useAuthStore((state) => state.clearError);
  const clearInfoMessage = useAuthStore((state) => state.clearInfoMessage);

  const isAuthenticated = useMemo(
    () => user !== null && session !== null,
    [session, user],
  );

  const isAdmin = useMemo(
    () => (user ? canAccessAdminArea(user.role, user.email) : false),
    [user],
  );

  const canOpenAdmin = useMemo(
    () => (user ? canSeeAdminEntry(user.email) : false),
    [user],
  );

  const needsOnboarding = useMemo(
    () => Boolean(user && user.role === 'student' && !user.onboardingCompleted),
    [user],
  );

  return {
    user,
    session,
    isLoading,
    isInitialized,
    isAuthenticated,
    isAdmin,
    canOpenAdmin,
    needsOnboarding,
    error,
    infoMessage,
    signIn,
    signUp,
    requestPasswordReset,
    becomeAdmin,
    completeOnboarding,
    signOut,
    clearError,
    clearInfoMessage,
  };
}
