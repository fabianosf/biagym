import { useAuth } from '@/features/auth';
import { getFriendlyErrorMessage } from '@/shared/errors';
import { isExpoGo } from '@/shared/runtime/expo-go';
import { useT } from '@/shared/theme';
import {
  DATA_FETCH_TIMEOUT_MS,
  disablePushNotifications,
  enablePushNotifications,
  getDevicePushPermissionStatus,
  getNotificationPreferences,
  refreshPushTokenIfEnabled,
  sendTestPushNotification,
  withTimeout,
} from '@/services';
import type { NotificationPreferences } from '@/domain/notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type NotificationPreferencesState = {
  preferences: NotificationPreferences;
  permissionStatus: string;
  isLoading: boolean;
  isSaving: boolean;
  isSendingTest: boolean;
  error: string | null;
  success: string | null;
  isPushLimitedInRuntime: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  expoPushToken: null,
  platform: null,
  updatedAt: null,
};

export function useNotificationPreferences() {
  const t = useT();
  const { user, isInitialized } = useAuth();
  const [state, setState] = useState<NotificationPreferencesState>({
    preferences: DEFAULT_PREFERENCES,
    permissionStatus: 'undetermined',
    isLoading: true,
    isSaving: false,
    isSendingTest: false,
    error: null,
    success: null,
    isPushLimitedInRuntime: isExpoGo(),
  });

  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!isInitialized) {
      return;
    }

    if (!user) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setState((current) => ({
        ...current,
        preferences: DEFAULT_PREFERENCES,
        isLoading: false,
      }));
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const [preferences, permission] = await withTimeout(
        Promise.all([getNotificationPreferences(user.id), getDevicePushPermissionStatus()]),
        DATA_FETCH_TIMEOUT_MS,
        t('notifications.loadTimeout'),
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        preferences,
        permissionStatus: permission,
        isLoading: false,
        isPushLimitedInRuntime: isExpoGo(),
      }));
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setState((current) => ({
        ...current,
        isLoading: false,
        error: getFriendlyErrorMessage(error),
      }));
    }
  }, [isInitialized, user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshPushTokenIfEnabled(user.id)
          .then((preferences) => {
            setState((current) => ({ ...current, preferences }));
          })
          .catch(() => undefined);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [user]);

  const enableNotifications = useCallback(async () => {
    if (!user) {
      return;
    }

    setState((current) => ({
      ...current,
      isSaving: true,
      error: null,
      success: null,
    }));

    try {
      const preferences = await enablePushNotifications(user.id);
      const permission = await getDevicePushPermissionStatus();

      setState((current) => ({
        ...current,
        preferences,
        permissionStatus: permission,
        isSaving: false,
        success: t('notifications.enabledSuccess'),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: getFriendlyErrorMessage(error),
      }));
    }
  }, [user, t]);

  const disableNotifications = useCallback(async () => {
    if (!user) {
      return;
    }

    setState((current) => ({
      ...current,
      isSaving: true,
      error: null,
      success: null,
    }));

    try {
      const preferences = await disablePushNotifications(user.id);
      setState((current) => ({
        ...current,
        preferences,
        isSaving: false,
        success: t('notifications.disabledSuccess'),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: getFriendlyErrorMessage(error),
      }));
    }
  }, [user, t]);

  const toggleNotifications = useCallback(
    async (nextEnabled: boolean) => {
      if (nextEnabled) {
        await enableNotifications();
        return;
      }

      await disableNotifications();
    },
    [disableNotifications, enableNotifications],
  );

  const sendTestNotification = useCallback(async () => {
    if (!user) {
      return;
    }

    setState((current) => ({
      ...current,
      isSendingTest: true,
      error: null,
      success: null,
    }));

    try {
      await sendTestPushNotification(user.id);
      setState((current) => ({
        ...current,
        isSendingTest: false,
        success: t('notifications.testSentSuccess'),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isSendingTest: false,
        error: getFriendlyErrorMessage(error),
      }));
    }
  }, [user, t]);

  return {
    ...state,
    refetch: load,
    toggleNotifications,
    sendTestNotification,
  };
}
