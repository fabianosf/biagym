import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoComplete?: 'password' | 'new-password';
  error?: string | null;
};

export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder = '••••••••',
  autoComplete = 'password',
  error,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      <View
        className={`flex-row items-center rounded-2xl border bg-elevated px-3.5 ${
          error ? 'border-red-500/60' : focused ? 'border-primary/50' : 'border-line'
        }`}
      >
        <Ionicons name="lock-closed-outline" size={18} color={focused ? '#E8573A' : '#9B9B9B'} />
        <TextInput
          secureTextEntry={!isVisible}
          autoComplete={autoComplete}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9B9B9B"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 px-3 py-3.5 text-base text-ink"
        />
        <Pressable
          onPress={() => setIsVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons
            name={isVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#9B9B9B"
          />
        </Pressable>
      </View>
      {error ? <Text className="mt-1.5 text-xs text-red-400">{error}</Text> : null}
    </View>
  );
}
