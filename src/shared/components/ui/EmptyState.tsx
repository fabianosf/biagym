import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type EmptyStateIcon =
  | 'folder-open-outline'
  | 'barbell-outline'
  | 'time-outline'
  | 'lock-closed-outline';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: EmptyStateIcon;
};

export function EmptyState({
  title,
  description,
  icon = 'folder-open-outline',
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center rounded-card border border-dashed border-line bg-surface px-6 py-12">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-elevated">
        <Ionicons name={icon} size={24} color="#E8573A" />
      </View>
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-2 text-center text-sm leading-6 text-muted">{description}</Text>
      ) : null}
    </View>
  );
}
