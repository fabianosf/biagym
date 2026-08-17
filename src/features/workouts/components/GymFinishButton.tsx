import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GymFinishButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function GymFinishButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: GymFinishButtonProps) {
  const insets = useSafeAreaInsets();
  const isDisabled = disabled || loading;

  return (
    <View className="bg-gym px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        className={`min-h-[56px] items-center justify-center rounded-full bg-gymAccent ${
          isDisabled ? 'opacity-50' : 'active:opacity-90'
        }`}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator color="#111111" />
        ) : (
          <Text className="text-base font-bold text-gymOnAccent">{label}</Text>
        )}
      </Pressable>
    </View>
  );
}
