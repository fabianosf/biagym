import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type PrescriptionStatCardProps = {
  label: string;
  value: string;
  editable?: boolean;
  onPress?: () => void;
};

export function PrescriptionStatCard({
  label,
  value,
  editable = false,
  onPress,
}: PrescriptionStatCardProps) {
  const card = (
    <View className="min-h-[92px] flex-1 rounded-2xl bg-gymCard px-4 py-4">
      {editable ? (
        <View className="absolute right-3 top-3">
          <Ionicons name="pencil" size={14} color="#A3A3A3" />
        </View>
      ) : null}
      <Text className="text-[13px] text-gymMuted">{label}</Text>
      <Text className="mt-3 text-[22px] font-bold text-white" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );

  if (!editable || !onPress) {
    return <View className="flex-1">{card}</View>;
  }

  return (
    <Pressable
      className="flex-1"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Editar ${label}`}
    >
      {card}
    </Pressable>
  );
}
