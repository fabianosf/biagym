import { useAuth } from '@/features/auth';
import {
  countPendingProgressActions,
  isLessonDownloaded,
  syncPendingProgress,
} from '@/services';
import { subscribeToConnectivity } from '@/services/network/connectivity.service';
import { clearStaleLessonDownloads } from '@/services/offline/video-download.service';
import { useCallback, useEffect } from 'react';

import { useOfflineStore } from '../store/offline.store';

export function useOfflineSync() {
  const { user } = useAuth();
  const isOnline = useOfflineStore((state) => state.isOnline);
  const syncStatus = useOfflineStore((state) => state.syncStatus);
  const pendingCount = useOfflineStore((state) => state.pendingCount);
  const syncError = useOfflineStore((state) => state.syncError);
  const setOnline = useOfflineStore((state) => state.setOnline);
  const setSyncStatus = useOfflineStore((state) => state.setSyncStatus);
  const setPendingCount = useOfflineStore((state) => state.setPendingCount);

  const refreshPendingCount = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    const count = await countPendingProgressActions(user.id);
    setPendingCount(count);
  }, [setPendingCount, user]);

  const runSync = useCallback(async () => {
    if (!user) {
      return;
    }

    setSyncStatus('syncing');
    try {
      const result = await syncPendingProgress(user.id);
      setPendingCount(result.pendingCount);

      if (result.failedCount > 0) {
        setSyncStatus('error', 'Algumas alterações não puderam ser sincronizadas.');
        return;
      }

      if (result.syncedCount > 0) {
        setSyncStatus('success');
      } else {
        setSyncStatus('idle');
      }
    } catch {
      setSyncStatus('error', 'Falha ao sincronizar progresso.');
    }
  }, [setPendingCount, setSyncStatus, user]);

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    return subscribeToConnectivity((online) => {
      setOnline(online);
    });
  }, [setOnline]);

  useEffect(() => {
    if (!user || !isOnline) {
      return;
    }

    void runSync();
  }, [isOnline, runSync, user]);

  useEffect(() => {
    void clearStaleLessonDownloads(30);
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    syncError,
    refreshPendingCount,
    runSync,
  };
}

export function useLessonDownload(lessonId: string | undefined) {
  const setDownloadState = useOfflineStore((state) => state.setDownloadState);
  const setDownloadProgress = useOfflineStore((state) => state.setDownloadProgress);
  const resetDownloadState = useOfflineStore((state) => state.resetDownloadState);
  const downloadState = useOfflineStore((state) =>
    lessonId ? (state.downloadStates[lessonId] ?? 'idle') : 'idle',
  );
  const downloadProgress = useOfflineStore((state) =>
    lessonId ? (state.downloadProgress[lessonId] ?? 0) : 0,
  );

  useEffect(() => {
    if (!lessonId) {
      return;
    }

    void (async () => {
      const downloaded = await isLessonDownloaded(lessonId);
      setDownloadState(lessonId, downloaded ? 'downloaded' : 'idle');
    })();
  }, [lessonId, setDownloadState]);

  return {
    downloadState,
    downloadProgress,
    setDownloadState,
    setDownloadProgress,
    resetDownloadState,
  };
}
