import type { SendPushNotificationInput } from '@/domain/notifications';
import Constants from 'expo-constants';
import type * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PushPlatform } from '@/domain/notifications';

import { DataServiceError } from '../shared';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from './push-preferences.repository';
import {
  assertRemotePushSupported,
  isRemotePushSupportedInRuntime,
} from './push-notification.runtime';

type NotificationsModule = typeof Notifications;

let notificationsModulePromise: Promise<NotificationsModule> | null = null;
let notificationHandlerConfigured = false;

async function loadNotificationsModule(): Promise<NotificationsModule> {
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }

  return notificationsModulePromise;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!isRemotePushSupportedInRuntime()) {
    return null;
  }

  const Notifications = await loadNotificationsModule();

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

function resolvePushPlatform(): PushPlatform {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  if (Platform.OS === 'android') {
    return 'android';
  }

  return 'web';
}

export async function getDevicePushPermissionStatus(): Promise<string> {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return 'undetermined';
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestPushPermission(): Promise<string> {
  assertRemotePushSupported();

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return 'undetermined';
  }

  const current = await Notifications.getPermissionsAsync();

  if (current.status === 'granted') {
    return current.status;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requested.status;
}

export async function obtainExpoPushToken(): Promise<string | null> {
  assertRemotePushSupported();

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    throw new DataServiceError(
      'configuration_error',
      undefined,
      'Configure EXPO_PUBLIC_EAS_PROJECT_ID para registrar push tokens.',
    );
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BiAGym',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function enablePushNotifications(userId: string) {
  const permission = await requestPushPermission();

  if (permission !== 'granted') {
    throw new DataServiceError(
      'forbidden',
      undefined,
      'Permissão de notificação negada. Ative nas configurações do dispositivo.',
    );
  }

  const expoPushToken = await obtainExpoPushToken();

  if (!expoPushToken) {
    throw new DataServiceError(
      'unknown',
      undefined,
      'Não foi possível obter o token de push.',
    );
  }

  return updateNotificationPreferences(userId, {
    enabled: true,
    expoPushToken,
    platform: resolvePushPlatform(),
  });
}

export async function disablePushNotifications(userId: string) {
  return updateNotificationPreferences(userId, {
    enabled: false,
    expoPushToken: null,
    platform: null,
  });
}

export async function refreshPushTokenIfEnabled(userId: string) {
  if (!isRemotePushSupportedInRuntime()) {
    return getNotificationPreferences(userId);
  }

  const preferences = await getNotificationPreferences(userId);

  if (!preferences.enabled) {
    return preferences;
  }

  try {
    const permission = await getDevicePushPermissionStatus();

    if (permission !== 'granted') {
      return disablePushNotifications(userId);
    }

    const expoPushToken = await obtainExpoPushToken();

    if (!expoPushToken) {
      return preferences;
    }

    return updateNotificationPreferences(userId, {
      enabled: true,
      expoPushToken,
      platform: resolvePushPlatform(),
    });
  } catch {
    return preferences;
  }
}

export { getNotificationPreferences };

export async function sendPushNotification(input: SendPushNotificationInput) {
  const { getSupabaseClient } = await import('../supabase/client');
  const { isSupabaseConfigured } = await import('../supabase/client');
  const { assertSupabaseConfigured } = await import('../shared');

  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('send-push-notification', {
    body: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      data: input.data ?? {},
    },
  });

  if (error) {
    throw new DataServiceError('unknown', error, error.message);
  }

  return data;
}

export async function sendTestPushNotification(userId: string) {
  return sendPushNotification({
    userId,
    title: 'BiAGym',
    body: 'Notificações ativadas com sucesso! 💪',
    type: 'test',
    data: { screen: 'profile' },
  });
}

export async function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return { remove: () => undefined };
  }

  return Notifications.addNotificationReceivedListener(listener);
}

export async function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return { remove: () => undefined };
  }

  return Notifications.addNotificationResponseReceivedListener(listener);
}
