import { AdminStudentAvatar } from '@/features/admin/components/AdminStudentAvatar';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import type { StudentActivity } from '@/features/admin/hooks/useAdminOverview';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT, useThemeColors } from '@/shared/theme';
import { formatRelativeAccessDate } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  items: StudentActivity[];
  limit?: number;
  /** 'relative' mostra "desde 12 mar", 'days' mostra "12 dias sem treinar". */
  variant?: 'relative' | 'days';
};

export function QuietStudentsList({ title, items, limit = 5, variant = 'relative' }: Props) {
  const router = useRouter();
  const t = useT();
  const colors = useThemeColors();

  function formatDaysSince(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    return t(days === 1 ? 'admin.dashboard.daysSinceOne' : 'admin.dashboard.daysSinceOther', {
      days: String(days),
    });
  }

  const list = items.slice(0, limit);

  if (list.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">{title}</Text>
      {list.map(({ student, lastActivity }) => (
        <Pressable
          key={student.userId}
          onPress={() => router.push(adminRoutes.studentSpace(student.userId) as Href)}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 active:opacity-85"
        >
          <AdminStudentAvatar student={student} size={40} />
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
              {getStudentFirstName(student.name)}
            </Text>
            <Text className="mt-0.5 text-xs text-amber-500">
              {lastActivity
                ? variant === 'days'
                  ? formatDaysSince(lastActivity)
                  : t('admin.dashboard.sinceDate', { date: formatRelativeAccessDate(lastActivity) })
                : t('admin.dashboard.neverTrained')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.faint} />
        </Pressable>
      ))}
    </View>
  );
}
