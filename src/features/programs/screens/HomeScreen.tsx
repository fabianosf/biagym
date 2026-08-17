import { BrandHeader, ContinueWatchBar, ProgramCarousel } from '@/features/programs/components';
import { useCatalog } from '@/features/programs/hooks';
import { OfflineBanner } from '@/features/offline';
import { useAuth } from '@/features/auth';
import { EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import { routes } from '@/shared/constants/routes';
import { formatHelloGreeting } from '@/shared/utils/person-name';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import type { Href } from 'expo-router';

export function HomeScreen() {
  const { user } = useAuth();
  const {
    catalog,
    myItems,
    progressByProgramId,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useCatalog();
  const [dismissedContinue, setDismissedContinue] = useState(false);

  const startedPrograms = useMemo(
    () =>
      myItems.filter((program) => {
        const progress = progressByProgramId[program.id];
        return Boolean(progress && progress.percentComplete > 0);
      }),
    [myItems, progressByProgramId],
  );

  const continueItem = startedPrograms[0];
  const continueProgress = continueItem ? progressByProgramId[continueItem.id] : null;

  const categoryRows = useMemo(() => {
    const grouped = new Map<string, typeof catalog>();

    for (const program of catalog) {
      const names = program.categories.length > 0 ? program.categories.map((item) => item.name) : ['Treinos'];
      for (const name of names) {
        const current = grouped.get(name) ?? [];
        current.push(program);
        grouped.set(name, current);
      }
    }

    return [...grouped.entries()];
  }, [catalog]);

  return (
    <View className="flex-1 bg-background">
      <BrandHeader />
      <View className="px-5 pb-2">
        <Text className="text-[28px] font-bold text-ink">{formatHelloGreeting(user?.name)}</Text>
      </View>
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando programas..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-28 pt-2"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refetch()}
              tintColor="#E8573A"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {continueItem && continueProgress && !dismissedContinue ? (
            <ContinueWatchBar
              program={continueItem}
              progress={continueProgress}
              lessonId={continueProgress.lastLessonId ?? continueProgress.completedLessonIds[0] ?? ''}
              lessonTitle="Retomar aula"
              onDismiss={() => setDismissedContinue(true)}
            />
          ) : null}

          {startedPrograms.length === 0 && myItems.length === 0 && catalog.length === 0 ? (
            <View className="px-5">
              <EmptyState
                icon="barbell-outline"
                title="Nenhum treino ainda"
                description="Quando a treinadora publicar treinos, eles aparecem aqui."
              />
            </View>
          ) : null}

          <ProgramCarousel
            title="Programas iniciados"
            subtitle="Aqueles em que você já fez uma ou mais aulas"
            programs={startedPrograms}
            progressByProgramId={progressByProgramId}
            seeMoreHref={routes.progress}
          />

          <ProgramCarousel
            title="Meus itens"
            subtitle="Programas com acesso liberado"
            programs={myItems}
            progressByProgramId={progressByProgramId}
            seeMoreHref={routes.library as Href}
          />

          {categoryRows.map(([name, programs]) => (
            <ProgramCarousel
              key={name}
              title={name}
              subtitle="Treinos de todos os tipos para todos os objetivos"
              programs={programs}
              progressByProgramId={progressByProgramId}
              seeMoreHref={routes.store as Href}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
