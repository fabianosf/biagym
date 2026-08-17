import { colors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type AdminStudentActionCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function AdminStudentActionCard({
  title,
  description,
  icon,
  onPress,
}: AdminStudentActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="min-w-[46%] flex-1 rounded-card border border-line bg-surface p-4 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text className="mt-3 text-sm font-semibold text-ink">{title}</Text>
      <Text className="mt-1 text-xs leading-4 text-muted">{description}</Text>
    </Pressable>
  );
}
