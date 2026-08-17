import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import { CONNECTIVITY_TIMEOUT_MS, withTimeout } from '../shared/with-timeout';

export type ConnectivityListener = (isOnline: boolean) => void;

export async function isOnline(): Promise<boolean> {
  try {
    const state = await withTimeout(NetInfo.fetch(), CONNECTIVITY_TIMEOUT_MS);
    return resolveIsOnline(state);
  } catch {
    return true;
  }
}

export function subscribeToConnectivity(listener: ConnectivityListener): () => void {
  return NetInfo.addEventListener((state) => {
    listener(resolveIsOnline(state));
  });
}

function resolveIsOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return false;
  }

  if (state.isInternetReachable === false) {
    return false;
  }

  return true;
}
