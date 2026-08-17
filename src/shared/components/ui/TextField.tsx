import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/shared/theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad' | 'number-pad' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'email' | 'name' | 'tel';
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  icon = 'mail-outline',
  error,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const colors = useThemeColors();

  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      <View
        className={`flex-row items-center rounded-2xl border bg-elevated px-3.5 ${
          error ? 'border-red-500/60' : focused ? 'border-primary/50' : 'border-line'
        }`}
      >
        <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.faint} />
        <TextInput
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 px-3 py-3.5 text-base text-ink"
        />
      </View>
      {error ? <Text className="mt-1.5 text-xs text-red-400">{error}</Text> : null}
    </View>
  );
}
