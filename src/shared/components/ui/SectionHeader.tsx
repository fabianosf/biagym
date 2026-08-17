import { Text, View } from 'react-native';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <View className="mb-4">
      {eyebrow ? (
        <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-xl font-semibold tracking-tight text-ink">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-sm leading-5 text-muted">{subtitle}</Text>
      ) : null}
    </View>
  );
}
