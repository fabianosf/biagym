import { useThemeColors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type ShortcutTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function ShortcutTile({ icon, label, onPress }: ShortcutTileProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className="items-center gap-2 active:opacity-80"
      style={{ width: 74 }}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text className="text-center text-xs font-semibold text-ink" numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}
