import type { AuthSession, AuthUser } from '@/domain';
import type { SignInCredentials, SignUpInput } from '@/domain/auth';
import type { CompleteOnboardingInput } from '@/domain/student';
import { create } from 'zustand';

import {
  getAuthErrorMessage,
  getCurrentSession,
  onAuthStateChange,
  requestPasswordReset,
  signInWithEmail,
  signOut as signOutService,
  signUpWithEmail,
  promoteCurrentUserToAdmin,
  completeStudentOnboarding,
} from '@/services/auth';
import { isSupabaseConfigured } from '@/services/supabase';

type AuthStore = {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  infoMessage: string | null;
  initialize: () => Promise<void>;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<void>;
  becomeAdmin: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  clearInfoMessage: () => void;
  setSession: (session: AuthSession | null) => void;
};

let unsubscribeAuthListener: (() => void) | null = null;

function applySession(set: (partial: Partial<AuthStore>) => void, session: AuthSession | null) {
  set({
    session,
    user: session?.user ?? null,
  });
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  infoMessage: null,

  setSession: (session) => {
    applySession(set, session);
  },

  clearError: () => {
    set({ error: null });
  },

  clearInfoMessage: () => {
    set({ infoMessage: null });
  },

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      set({ isInitialized: true });
      return;
    }

    try {
      const session = await Promise.race([
        getCurrentSession(),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 6000);
        }),
      ]);
      applySession(set, session);
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
    } finally {
      if (!unsubscribeAuthListener) {
        unsubscribeAuthListener = onAuthStateChange((session) => {
          applySession(set, session);
        });
      }

      set({ isInitialized: true });
    }
  },

  signIn: async (credentials) => {
    set({ isLoading: true, error: null, infoMessage: null });

    try {
      const session = await signInWithEmail(credentials);
      applySession(set, session);
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (input) => {
    set({ isLoading: true, error: null, infoMessage: null });

    try {
      const session = await signUpWithEmail(input);

      if (session) {
        applySession(set, session);
        return;
      }

      set({
        infoMessage:
          'Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.',
      });
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  requestPasswordReset: async (email) => {
    set({ isLoading: true, error: null, infoMessage: null });

    try {
      await requestPasswordReset(email);
      set({
        infoMessage:
          'Se este e-mail estiver cadastrado, enviaremos o link de redefinição de senha.',
      });
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null, infoMessage: null });

    try {
      await signOutService();
      applySession(set, null);
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  becomeAdmin: async () => {
    set({ isLoading: true, error: null });

    try {
      const session = await promoteCurrentUserToAdmin();
      applySession(set, session);
      return true;
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const session = await completeStudentOnboarding(input);
      applySession(set, session);
    } catch (error) {
      set({ error: getAuthErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export function resetAuthStoreForTests(): void {
  unsubscribeAuthListener?.();
  unsubscribeAuthListener = null;
  useAuthStore.setState({
    user: null,
    session: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    infoMessage: null,
  });
}
