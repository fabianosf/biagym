import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { addNotificationResponseListener } from '@/services';
import { isRemotePushSupportedInRuntime } from '@/services/notifications/push-notification.runtime';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isRemotePushSupportedInRuntime()) {
      return;
    }

    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    void addNotificationResponseListener((response) => {
      const screen = response.notification.request.content.data?.screen;

      if (typeof screen === 'string' && screen === 'profile') {
        router.push('/profile');
      }
    }).then((activeSubscription) => {
      if (cancelled) {
        activeSubscription.remove();
        return;
      }

      subscription = activeSubscription;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [router]);

  return children;
}
