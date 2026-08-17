import type { ReactNode } from 'react';

import { useAuth } from '@/features/auth';
import {
  initSentry,
  setSentryScreenContext,
  setSentryUser,
} from '@/services/observability';
import { usePathname, useSegments } from 'expo-router';
import { useEffect } from 'react';

initSentry();

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    setSentryUser(
      user
        ? {
            id: user.id,
            role: user.role,
          }
        : null,
    );
  }, [user]);

  useEffect(() => {
    setSentryScreenContext(pathname, segments.join('/'));
  }, [pathname, segments]);

  return children;
}
