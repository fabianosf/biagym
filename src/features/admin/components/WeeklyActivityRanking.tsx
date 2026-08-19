import { AdminStudentAvatar } from '@/features/admin/components/AdminStudentAvatar';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import type { RankedStudent } from '@/features/admin/hooks/useAdminOverview';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useThemeColors } from '@/shared/theme';
import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const RANK_STYLES = [
  { bg: '#F5C400', color: '#4A3B00' },
  { bg: '#D8DEDA', color: '#3C4A44' },
  { bg: '#E3B487', color: '#4A2F13' },
];

export function WeeklyActivityRanking({ items }: { items: RankedStudent[] }) {
  const router = useRouter();
  const colors = useThemeColors();

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
        Mais ativos essa semana
      </Text>
      {items.map(({ student, sessionCount }, index) => {
        const rankStyle = RANK_STYLES[index];
        return (
          <Pressable
            key={student.userId}
            onPress={() => router.push(adminRoutes.studentSpace(student.userId) as Href)}
            className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-3 active:opacity-85"
          >
            <View>
              <AdminStudentAvatar student={student} size={40} />
              <View
                className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border-2"
                style={{
                  backgroundColor: rankStyle?.bg ?? colors.elevated,
                  borderColor: colors.surface,
                }}
              >
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: rankStyle?.color ?? colors.muted }}
                >
                  {index + 1}
                </Text>
              </View>
            </View>
            <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
              {getStudentFirstName(student.name)}
            </Text>
            <Text className="text-xs font-bold text-primary">
              {sessionCount} {sessionCount === 1 ? 'treino' : 'treinos'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
