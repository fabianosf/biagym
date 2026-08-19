import { useThemeColors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type MetricCardVisual =
  | { type: 'progress'; ratio: number }
  | { type: 'sparkline'; values: number[] };

type MetricCardTone = 'accent' | 'warning' | 'neutral';

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone?: MetricCardTone;
  visual?: MetricCardVisual;
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <View className="flex-row items-end gap-1" style={{ height: 22 }}>
      {values.map((value, index) => (
        <View
          key={index}
          className="flex-1 rounded-full"
          style={{
            height: value === 0 ? 3 : 3 + (value / max) * 19,
            backgroundColor: color,
            opacity: value === 0 ? 0.22 : 1,
          }}
        />
      ))}
    </View>
  );
}

export function MetricCard({ icon, value, label, tone = 'neutral', visual }: MetricCardProps) {
  const colors = useThemeColors();
  const toneColor = tone === 'accent' ? colors.primary : tone === 'warning' ? colors.warning : colors.ink;
  const iconBg = tone === 'accent' ? 'bg-primary/12' : tone === 'warning' ? 'bg-amber-500/15' : 'bg-surface';

  return (
    <View
      className="flex-1 justify-between rounded-2xl border border-line bg-elevated p-4"
      style={{ minHeight: 132 }}
    >
      <View>
        <View className={`h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
          <Ionicons name={icon} size={16} color={toneColor} />
        </View>
        <Text className="mt-3 text-[22px] font-bold" style={{ color: toneColor }}>
          {value}
        </Text>
        <Text className="mt-0.5 text-[11px] leading-4 text-muted" numberOfLines={2}>
          {label}
        </Text>
      </View>

      <View className="mt-3">
        {visual?.type === 'progress' ? (
          <View className="h-1.5 overflow-hidden rounded-full bg-surface">
            <View
              className="h-1.5 rounded-full"
              style={{ width: `${Math.round(visual.ratio * 100)}%`, backgroundColor: toneColor }}
            />
          </View>
        ) : null}
        {visual?.type === 'sparkline' ? <Sparkline values={visual.values} color={toneColor} /> : null}
      </View>
    </View>
  );
}
