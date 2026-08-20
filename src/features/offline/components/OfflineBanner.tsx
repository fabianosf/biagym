import { useOfflineStore } from '@/features/offline/store/offline.store';
import { useT } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

export function OfflineBanner() {
  const t = useT();
  const isOnline = useOfflineStore((state) => state.isOnline);

  if (isOnline) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-2 bg-amber-500/20 px-4 py-2">
      <Ionicons name="cloud-offline-outline" size={16} color="#FBBF24" />
      <Text className="flex-1 text-sm text-amber-100">{t('offline.bannerMessage')}</Text>
    </View>
  );
}
