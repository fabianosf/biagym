import { colors } from '@/shared/theme';
import { useLessonDownload } from '@/features/offline/hooks/useOfflineSync';
import { useOfflineStore } from '@/features/offline/store/offline.store';
import {
  downloadLessonVideo,
  removeLessonDownload,
  subscribeToLessonDownloadProgress,
} from '@/services';
import { getFriendlyErrorMessage } from '@/shared/errors';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type LessonDownloadButtonProps = {
  lessonId: string;
  programId: string;
  remoteUrl: string;
  compact?: boolean;
};

export function LessonDownloadButton({
  lessonId,
  programId,
  remoteUrl,
  compact = false,
}: LessonDownloadButtonProps) {
  const isOnline = useOfflineStore((state) => state.isOnline);
  const {
    downloadState,
    downloadProgress,
    setDownloadState,
    setDownloadProgress,
    resetDownloadState,
  } = useLessonDownload(lessonId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToLessonDownloadProgress(lessonId, ({ progress }) => {
      setDownloadProgress(lessonId, progress);
    });
  }, [lessonId, setDownloadProgress]);

  async function handleDownload() {
    if (!isOnline) {
      setError('Conecte-se à internet para baixar a aula.');
      return;
    }

    setError(null);
    setDownloadState(lessonId, 'downloading');
    setDownloadProgress(lessonId, 0);

    try {
      await downloadLessonVideo({ lessonId, programId, remoteUrl });
      setDownloadState(lessonId, 'downloaded');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setDownloadState(lessonId, 'error');
      setError(getFriendlyErrorMessage(err));
    }
  }

  async function handleRemove() {
    setError(null);
    await removeLessonDownload(lessonId);
    resetDownloadState(lessonId);
    setDownloadState(lessonId, 'idle');
  }

  if (downloadState === 'downloading') {
    return (
      <View className={`flex-row items-center ${compact ? '' : 'gap-2'}`}>
        <ActivityIndicator size="small" color={colors.primary} />
        {!compact ? (
          <Text className="text-xs text-primary">
            Baixando {Math.round(downloadProgress * 100)}%
          </Text>
        ) : null}
      </View>
    );
  }

  if (downloadState === 'downloaded') {
    return (
      <Pressable
        onPress={() => void handleRemove()}
        className={`flex-row items-center rounded-full bg-primary/20 ${
          compact ? 'px-2 py-1' : 'px-3 py-1.5'
        }`}
      >
        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
        {!compact ? (
          <Text className="ml-1 text-xs text-primary">Offline · remover</Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View>
      <Pressable
        disabled={!isOnline}
        onPress={() => void handleDownload()}
        className={`flex-row items-center rounded-full border border-line ${
          compact ? 'px-2 py-1' : 'px-3 py-1.5'
        } ${!isOnline ? 'opacity-50' : ''}`}
      >
        <Ionicons name="download-outline" size={14} color="#1A1A1A" />
        {!compact ? <Text className="ml-1 text-xs text-ink">Baixar</Text> : null}
      </Pressable>
      {error ? <Text className="mt-1 text-[10px] text-red-400">{error}</Text> : null}
    </View>
  );
}
