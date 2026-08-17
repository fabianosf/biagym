import { Text, View } from 'react-native';

type BadgeTone = 'primary' | 'neutral' | 'warning' | 'cyan';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

const TONE_CLASS: Record<BadgeTone, string> = {
  primary: 'bg-primary/15',
  neutral: 'bg-elevated',
  warning: 'bg-amber-500/15',
  cyan: 'bg-cyan/15',
};

const TEXT_CLASS: Record<BadgeTone, string> = {
  primary: 'text-primary',
  neutral: 'text-muted',
  warning: 'text-amber-700',
  cyan: 'text-cyan',
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${TONE_CLASS[tone]}`}>
      <Text className={`text-[11px] font-semibold uppercase tracking-wide ${TEXT_CLASS[tone]}`}>
        {label}
      </Text>
    </View>
  );
}
