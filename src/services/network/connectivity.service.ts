import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityListener = (isOnline: boolean) => void;

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return resolveIsOnline(state);
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
