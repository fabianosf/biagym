import { useThemeColors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type EmptyStateIcon =
  | 'folder-open-outline'
  | 'barbell-outline'
  | 'time-outline'
  | 'lock-closed-outline';

type EmptyStateTone = 'light' | 'dark';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: EmptyStateIcon;
  tone?: EmptyStateTone;
};

export function EmptyState({
  title,
  description,
  icon = 'folder-open-outline',
  tone = 'light',
}: EmptyStateProps) {
  const colors = useThemeColors();
  const isDark = tone === 'dark';

  return (
    <View
      className={`items-center justify-center rounded-card border border-dashed px-6 py-12 ${
        isDark ? 'border-gymLine bg-gymCard' : 'border-line bg-surface'
      }`}
    >
      <View
        className={`mb-4 h-14 w-14 items-center justify-center rounded-full ${
          isDark ? 'bg-gym' : 'bg-elevated'
        }`}
      >
        <Ionicons name={icon} size={24} color={isDark ? colors.gymAccent : colors.primary} />
      </View>
      <Text
        className={`text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-ink'}`}
        style={{ maxWidth: 280 }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          className={`mt-2 text-center text-sm leading-6 ${isDark ? 'text-gymMuted' : 'text-muted'}`}
          style={{ maxWidth: 280 }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}
