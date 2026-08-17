import { colors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type FeedbackVariant = 'success' | 'warning' | 'info';

type FeedbackBannerProps = {
  message: string;
  variant?: FeedbackVariant;
};

const VARIANT_STYLES: Record<
  FeedbackVariant,
  { container: string; text: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  success: {
    container: 'bg-primary/10 border-primary/25',
    text: 'text-primary',
    icon: 'checkmark-circle',
    color: colors.primary,
  },
  warning: {
    container: 'bg-amber-500/10 border-amber-500/25',
    text: 'text-amber-800',
    icon: 'alert-circle',
    color: '#D97706',
  },
  info: {
    container: 'bg-elevated border-line',
    text: 'text-muted',
    icon: 'information-circle',
    color: '#6F6F6F',
  },
};

export function FeedbackBanner({ message, variant = 'info' }: FeedbackBannerProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <View className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 ${styles.container}`}>
      <Ionicons name={styles.icon} size={18} color={styles.color} />
      <Text className={`flex-1 text-sm leading-5 ${styles.text}`}>{message}</Text>
    </View>
  );
}
