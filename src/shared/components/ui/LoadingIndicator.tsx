import { ActivityIndicator, Text, View } from 'react-native';

import { useThemeColors } from '@/shared/theme';

type LoadingIndicatorProps = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingIndicator({
  message = 'Carregando...',
  fullScreen = false,
}: LoadingIndicatorProps) {
  const colors = useThemeColors();

  return (
    <View
      style={fullScreen ? { flex: 1, backgroundColor: colors.background } : undefined}
      className={fullScreen ? 'items-center justify-center' : 'items-center justify-center py-10'}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text className="mt-4 text-sm text-muted" style={{ color: colors.muted }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
