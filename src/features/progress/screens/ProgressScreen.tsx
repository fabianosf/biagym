import { colors } from '@/shared/theme';
import { CoachingPlanSection, CompletionHistorySection, ProgressProgramCard } from '@/features/progress/components';
import { useStudentProgress } from '@/features/progress/hooks';
import { OfflineBanner, SyncStatusBanner } from '@/features/offline';
import { useOfflineSync } from '@/features/offline/hooks/useOfflineSync';
import {
  EmptyState,
  ErrorState,
  LoadingIndicator,
  ScreenHeader,
  StatCard,
} from '@/shared/components';
import { useRouter, type Href } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export function ProgressScreen() {
  const router = useRouter();
  const { items, isLoading, isRefreshing, error, refetch } = useStudentProgress();
  const { runSync } = useOfflineSync();

  const inProgressCount = items.filter((item) => item.status === 'in_progress').length;
  const completedCount = items.filter((item) => item.status === 'completed').length;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Meu Plano"
        subtitle="Veja o que está em andamento e o que já foi concluído."
      />
      <OfflineBanner />
      <SyncStatusBanner onRetry={() => void runSync()} />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando progresso..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {items.length > 0 ? (
            <View className="mb-2 flex-row gap-3">
              <StatCard value={inProgressCount} label="Em andamento" />
              <StatCard value={completedCount} label="Concluídos" accent />
            </View>
          ) : null}

          {!isLoading && !error && items.length === 0 ? (
            <EmptyState
              title="Nenhum progresso ainda"
              description="Quando você assistir e concluir aulas de um programa, o histórico aparece aqui. Os treinos da academia ficam na aba Treinos."
            />
          ) : (
            items.map((item) => <ProgressProgramCard key={item.program.id} item={item} />)
          )}

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/evolution' as Href)}
              className="flex-1 rounded-card border border-line bg-surface px-4 py-4"
            >
              <Text className="font-semibold text-ink">Evolução</Text>
              <Text className="mt-1 text-xs text-muted">Peso e fotos</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/messages' as Href)}
              className="flex-1 rounded-card border border-line bg-surface px-4 py-4"
            >
              <Text className="font-semibold text-ink">Recados</Text>
              <Text className="mt-1 text-xs text-muted">Fale com a treinadora</Text>
            </Pressable>
          </View>

          <CoachingPlanSection />
          <CompletionHistorySection />
        </ScrollView>
      ) : null}
    </View>
  );
}
