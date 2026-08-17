import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';

import { useAuthStore } from '../store/auth.store';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 800);

    if (isInitialized) {
      void SplashScreen.hideAsync();
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isInitialized]);

  return children;
}
