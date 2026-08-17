import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'border border-line bg-elevated',
  ghost: 'bg-transparent',
  danger: 'border border-red-500/30 bg-red-500/10',
};

const LABEL_CLASS: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-muted',
  danger: 'text-red-600',
};

const ICON_COLOR: Record<ButtonVariant, string> = {
  primary: '#FFFFFF',
  secondary: '#1A1A1A',
  ghost: '#6F6F6F',
  danger: '#E11D48',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center rounded-2xl px-5 ${VARIANT_CLASS[variant]} ${
        isDisabled ? 'opacity-50' : 'active:opacity-85'
      } ${className}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color={ICON_COLOR[variant]} />
          <Text className={`font-semibold ${LABEL_CLASS[variant]}`}>{label}</Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={18} color={ICON_COLOR[variant]} /> : null}
          <Text className={`font-semibold ${LABEL_CLASS[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function ButtonSlot({ children }: { children: ReactNode }) {
  return <View className="min-h-[52px] justify-center">{children}</View>;
}
