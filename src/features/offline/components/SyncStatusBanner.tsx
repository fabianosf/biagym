import { colors } from '@/shared/theme';
import { useOfflineStore } from '@/features/offline/store/offline.store';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type SyncStatusBannerProps = {
  onRetry?: () => void;
};

export function SyncStatusBanner({ onRetry }: SyncStatusBannerProps) {
  const syncStatus = useOfflineStore((state) => state.syncStatus);
  const pendingCount = useOfflineStore((state) => state.pendingCount);
  const syncError = useOfflineStore((state) => state.syncError);
  const isOnline = useOfflineStore((state) => state.isOnline);

  if (syncStatus === 'idle' && pendingCount === 0) {
    return null;
  }

  if (syncStatus === 'syncing') {
    return (
      <View className="flex-row items-center gap-2 bg-elevated px-4 py-2">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="text-sm text-muted">Sincronizando progresso...</Text>
      </View>
    );
  }

  if (syncStatus === 'success') {
    return (
      <View className="flex-row items-center gap-2 bg-primary/10 px-4 py-2">
        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        <Text className="text-sm text-primary">Progresso sincronizado com sucesso.</Text>
      </View>
    );
  }

  if (syncStatus === 'error' || pendingCount > 0) {
    return (
      <View className="flex-row items-center gap-2 bg-red-500/10 px-4 py-2">
        <Ionicons name="alert-circle" size={16} color="#F87171" />
        <Text className="flex-1 text-sm text-red-200">
          {syncError ??
            `${pendingCount} alteração${pendingCount === 1 ? '' : 'ões'} aguardando sincronização.`}
        </Text>
        {isOnline && onRetry ? (
          <Pressable onPress={onRetry} className="rounded-full bg-elevated px-3 py-1">
            <Text className="text-xs text-ink">Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return null;
}
