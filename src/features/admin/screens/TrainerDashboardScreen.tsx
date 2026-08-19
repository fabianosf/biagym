import {
  MetricCard,
  QuietStudentsList,
  ShortcutTile,
  WeeklyActivityRanking,
} from '@/features/admin/components';
import { useAdminOverview } from '@/features/admin/hooks/useAdminOverview';
import { useAuth } from '@/features/auth';
import { OfflineBanner } from '@/features/offline';
import { EmptyState, LoadingIndicator } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { formatHelloGreeting } from '@/shared/utils/person-name';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHORTCUTS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: Href }[] = [
  { icon: 'people-outline', label: 'Alunos', href: adminRoutes.students as Href },
  // Mesma tela da aba "Treinos" da barra inferior — o atalho só troca de aba, não empilha rota.
  { icon: 'barbell-outline', label: 'Treinos', href: '/workouts' as Href },
  // Mesma tela da aba "Programas" da barra inferior.
  { icon: 'play-circle-outline', label: 'Programas', href: '/store' as Href },
  { icon: 'chatbubbles-outline', label: 'Recados', href: adminRoutes.messages as Href },
];

export function TrainerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const {
    isLoading,
    activities,
    activeThisWeek,
    quiet,
    weeklyRanking,
    weeklySessionsCount,
    dailySessionCounts,
  } = useAdminOverview();

  const totalStudents = activities.length;
  const activeRatio = totalStudents > 0 ? activeThisWeek / totalStudents : 0;
  const quietRatio = totalStudents > 0 ? quiet.length / totalStudents : 0;

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-sm text-muted">{formatHelloGreeting(user?.name)}</Text>
        <Text className="mt-1 text-[26px] font-bold text-ink">Painel da Treinadora</Text>
      </View>
      <OfflineBanner />

      {isLoading ? (
        <LoadingIndicator fullScreen message="Carregando painel..." />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-5 pb-28 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {activities.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title="Nenhum aluno ainda"
              description="Seus alunos aparecem aqui assim que começarem a treinar."
            />
          ) : (
            <>
              <View className="flex-row gap-3">
                <MetricCard
                  icon="flash-outline"
                  value={String(activeThisWeek)}
                  label="alunos ativos essa semana"
                  tone="accent"
                  visual={{ type: 'progress', ratio: activeRatio }}
                />
                <MetricCard
                  icon="barbell-outline"
                  value={String(weeklySessionsCount)}
                  label="treinos concluídos essa semana"
                  tone="accent"
                  visual={{ type: 'sparkline', values: dailySessionCounts.map((day) => day.count) }}
                />
                <MetricCard
                  icon="alert-circle-outline"
                  value={String(quiet.length)}
                  label="inativos 14+ dias"
                  tone={quiet.length > 0 ? 'warning' : 'neutral'}
                  visual={{ type: 'progress', ratio: quietRatio }}
                />
              </View>

              <View>
                <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
                  Atalhos rápidos
                </Text>
                <View className="flex-row justify-between">
                  {SHORTCUTS.map((shortcut) => (
                    <ShortcutTile
                      key={shortcut.label}
                      icon={shortcut.icon}
                      label={shortcut.label}
                      onPress={() => router.push(shortcut.href)}
                    />
                  ))}
                </View>
              </View>

              <WeeklyActivityRanking items={weeklyRanking} />

              <QuietStudentsList title="Precisam de atenção" items={quiet} limit={5} variant="days" />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
