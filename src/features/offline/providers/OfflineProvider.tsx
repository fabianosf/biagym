import type { ReactNode } from 'react';

import { useOfflineSync } from '../hooks/useOfflineSync';

type OfflineProviderProps = {
  children: ReactNode;
};

export function OfflineProvider({ children }: OfflineProviderProps) {
  useOfflineSync();
  return children;
}
