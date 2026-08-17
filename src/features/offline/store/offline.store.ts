import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type DownloadUiState = 'idle' | 'downloading' | 'downloaded' | 'error';

type OfflineStoreState = {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  syncError: string | null;
  downloadStates: Record<string, DownloadUiState>;
  downloadProgress: Record<string, number>;
  setOnline: (isOnline: boolean) => void;
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
  setPendingCount: (count: number) => void;
  setDownloadState: (lessonId: string, state: DownloadUiState) => void;
  setDownloadProgress: (lessonId: string, progress: number) => void;
  resetDownloadState: (lessonId: string) => void;
};

export const useOfflineStore = create<OfflineStoreState>((set) => ({
  isOnline: true,
  syncStatus: 'idle',
  pendingCount: 0,
  syncError: null,
  downloadStates: {},
  downloadProgress: {},
  setOnline: (isOnline) => set({ isOnline }),
  setSyncStatus: (syncStatus, syncError = null) => set({ syncStatus, syncError }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setDownloadState: (lessonId, state) =>
    set((current) => ({
      downloadStates: { ...current.downloadStates, [lessonId]: state },
    })),
  setDownloadProgress: (lessonId, progress) =>
    set((current) => ({
      downloadProgress: { ...current.downloadProgress, [lessonId]: progress },
    })),
  resetDownloadState: (lessonId) =>
    set((current) => {
      const downloadStates = { ...current.downloadStates };
      const downloadProgress = { ...current.downloadProgress };
      delete downloadStates[lessonId];
      delete downloadProgress[lessonId];
      return { downloadStates, downloadProgress };
    }),
}));
