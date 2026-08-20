import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { translate } from '@/shared/i18n';
import { usePreferencesStore } from '@/shared/theme/preferences.store';

import { DataServiceError } from '../shared';

export function isExpoGoRuntime(): boolean {
  return Constants.appOwnership === 'expo';
}

export function isRemotePushSupportedInRuntime(): boolean {
  return Platform.OS !== 'web' && !isExpoGoRuntime() && Device.isDevice;
}

export function getExpoGoPushLimitationMessage(): string {
  return translate(usePreferencesStore.getState().locale, 'notifications.expoGoLimitation');
}

export function assertRemotePushSupported(): void {
  if (Platform.OS === 'web') {
    throw new DataServiceError(
      'validation_error',
      undefined,
      'Notificações push não estão disponíveis na versão web.',
    );
  }

  if (!Device.isDevice) {
    throw new DataServiceError(
      'validation_error',
      undefined,
      'Notificações push exigem um dispositivo físico.',
    );
  }

  if (isExpoGoRuntime()) {
    throw new DataServiceError(
      'configuration_error',
      undefined,
      getExpoGoPushLimitationMessage(),
    );
  }
}
