import { Text, View } from 'react-native';

type StatCardProps = {
  value: string | number;
  label: string;
  accent?: boolean;
};

export function StatCard({ value, label, accent = false }: StatCardProps) {
  return (
    <View className="flex-1 rounded-card border border-line bg-surface p-4">
      <Text className={`text-3xl font-semibold ${accent ? 'text-primary' : 'text-ink'}`}>
        {value}
      </Text>
      <Text className="mt-1.5 text-sm text-muted">{label}</Text>
    </View>
  );
}
