import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title = 'Não foi possível carregar',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center rounded-card border border-red-500/25 bg-red-500/10 px-6 py-8">
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
        <Ionicons name="cloud-offline-outline" size={24} color="#F87171" />
      </View>
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-6 text-red-700">{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className="mt-5 min-h-[44px] items-center justify-center rounded-2xl bg-primary px-5"
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text className="font-semibold text-white">{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
