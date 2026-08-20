import { QuietStudentsList } from '@/features/admin/components/QuietStudentsList';
import { ShortcutTile } from '@/features/admin/components/ShortcutTile';
import { useAdminOverview } from '@/features/admin/hooks/useAdminOverview';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT, useThemeColors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

type KpiTileProps = {
  value: string;
  label: string;
  tone?: 'accent' | 'warning' | 'neutral';
  onPress?: () => void;
};

function KpiTile({ value, label, tone = 'neutral', onPress }: KpiTileProps) {
  const colors = useThemeColors();
  const valueColor =
    tone === 'accent' ? colors.primary : tone === 'warning' ? '#D97706' : colors.ink;

  const content = (
    <View className="flex-1 justify-between rounded-2xl border border-line bg-surface p-4" style={{ minHeight: 92 }}>
      <Text className="text-2xl font-bold" style={{ color: valueColor }}>
        {value}
      </Text>
      <View className="flex-row items-end justify-between">
        <Text className="flex-1 text-xs leading-4 text-muted">{label}</Text>
        {onPress ? <Ionicons name="chevron-forward" size={14} color={colors.faint} /> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return <View style={{ width: '48%' }}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} className="active:opacity-80" style={{ width: '48%' }}>
      {content}
    </Pressable>
  );
}

export function AdminDashboard() {
  const t = useT();
  const router = useRouter();
  const {
    isLoading,
    activities,
    activeThisWeek,
    quiet,
    completionByProgram,
    overallCompletion,
    couponCount,
  } = useAdminOverview();

  if (isLoading) {
    return null;
  }

  return (
    <View className="gap-5 px-5 pt-2">
      <View>
        <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
          {t('admin.dashboard.overview')}
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          <KpiTile value={String(activities.length)} label={t('admin.dashboard.totalStudents')} />
          <KpiTile
            value={String(activeThisWeek)}
            label={t('admin.dashboard.activeThisWeekLabel')}
            tone="accent"
          />
          <KpiTile
            value={String(quiet.length)}
            label={t('admin.dashboard.inactive14Days')}
            tone={quiet.length > 0 ? 'warning' : 'neutral'}
          />
          <KpiTile
            value={overallCompletion != null ? `${overallCompletion}%` : '—'}
            label={t('admin.dashboard.averageCompletion')}
            onPress={() => router.push(adminRoutes.programs as Href)}
          />
        </View>
      </View>

      <View>
        <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
          {t('admin.dashboard.shortcuts')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4">
          <ShortcutTile
            icon="barbell-outline"
            label={t('admin.dashboard.plansShort')}
            onPress={() => router.push(adminRoutes.workouts as Href)}
          />
          <ShortcutTile
            icon="videocam-outline"
            label={t('admin.dashboard.exercisesShort')}
            onPress={() => router.push(adminRoutes.exercises as Href)}
          />
          <ShortcutTile
            icon="play-circle-outline"
            label={t('admin.dashboard.shortcutPrograms')}
            onPress={() => router.push(adminRoutes.programs)}
          />
          <ShortcutTile
            icon="ticket-outline"
            label={couponCount > 0 ? t('admin.dashboard.couponsWithCount', { count: String(couponCount) }) : t('admin.dashboard.coupons')}
            onPress={() => router.push(adminRoutes.store as Href)}
          />
        </ScrollView>
      </View>

      <QuietStudentsList title={t('admin.dashboard.fadingAway')} items={quiet} limit={5} variant="relative" />

      {completionByProgram.length > 0 ? (
        <View className="gap-2">
          <Text className="text-sm font-semibold text-ink">{t('admin.dashboard.completionByProgram')}</Text>
          {completionByProgram.map((item) => (
            <View key={item.title} className="rounded-2xl border border-line bg-surface px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-sm font-semibold text-primary">{item.averagePercent}%</Text>
              </View>
              <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
                <View
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${item.averagePercent}%` }}
                />
              </View>
              <Text className="mt-1 text-xs text-faint">
                {t(
                  item.studentCount === 1
                    ? 'admin.dashboard.studentCountOne'
                    : 'admin.dashboard.studentCountOther',
                  { count: String(item.studentCount) },
                )}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
