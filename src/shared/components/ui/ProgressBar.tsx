import { Text, View } from 'react-native';

type ProgressBarProps = {
  value: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
};

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  size = 'md',
}: ProgressBarProps) {
  const percent = clamp(value);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <View>
      {label || showPercentage ? (
        <View className="mb-2 flex-row items-center justify-between">
          {label ? <Text className="text-sm text-muted">{label}</Text> : <View />}
          {showPercentage ? (
            <Text className="text-sm font-semibold text-primary">{percent}%</Text>
          ) : null}
        </View>
      ) : null}

      <View className={`overflow-hidden rounded-full bg-line ${barHeight}`}>
        <View
          className={`rounded-full bg-primary ${barHeight}`}
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  );
}
