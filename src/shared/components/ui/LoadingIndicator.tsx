import { ActivityIndicator, Text, View } from 'react-native';

import { useT, useThemeColors } from '@/shared/theme';

type LoadingIndicatorProps = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingIndicator({ message, fullScreen = false }: LoadingIndicatorProps) {
  const t = useT();
  const colors = useThemeColors();
  const resolvedMessage = message ?? t('common.loadingGeneric');

  return (
    <View
      style={fullScreen ? { flex: 1, backgroundColor: colors.background } : undefined}
      className={fullScreen ? 'items-center justify-center' : 'items-center justify-center py-10'}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {resolvedMessage ? (
        <Text className="mt-4 text-sm text-muted" style={{ color: colors.muted }}>
          {resolvedMessage}
        </Text>
      ) : null}
    </View>
  );
}
