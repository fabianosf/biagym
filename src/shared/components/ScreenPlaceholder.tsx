import { Text, View } from 'react-native';

type ScreenPlaceholderProps = {
  title: string;
  description: string;
};

export function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-2xl font-semibold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-muted">{description}</Text>
    </View>
  );
}
