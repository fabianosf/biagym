import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  showBack = false,
  onBack,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-background px-5 pb-5" style={{ paddingTop: insets.top + 10 }}>
      <View className="flex-row items-center">
        {showBack ? (
          <Pressable
            onPress={onBack}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-line bg-elevated"
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.8px] text-primary">
              {eyebrow}
            </Text>
          ) : null}
          <Text className="text-[28px] font-semibold tracking-tight text-ink">{title}</Text>
          {subtitle ? (
            <Text className="mt-1 text-sm leading-5 text-muted">{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
