import Constants from 'expo-constants';
import * as Device from 'expo-device';

import { DataServiceError } from '../shared';

export function isExpoGoRuntime(): boolean {
  return Constants.appOwnership === 'expo';
}

export function isRemotePushSupportedInRuntime(): boolean {
  return !isExpoGoRuntime() && Device.isDevice;
}

export function getExpoGoPushLimitationMessage(): string {
  return 'Notificações push remotas não estão disponíveis no Expo Go. Use um development build para testar push.';
}

export function assertRemotePushSupported(): void {
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
