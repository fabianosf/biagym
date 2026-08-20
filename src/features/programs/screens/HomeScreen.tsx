import { colors, useT } from '@/shared/theme';
import { BrandHeader, ContinueWatchBar, ProgramCarousel } from '@/features/programs/components';
import { useCatalog } from '@/features/programs/hooks';
import { OfflineBanner } from '@/features/offline';
import { useAuth } from '@/features/auth';
import { AcademyWorkoutsSection, PersonalPerformanceCard } from '@/features/progress/components';
import { EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import { formatHelloGreeting, getGivenAndFamilyName } from '@/shared/utils/person-name';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

export function HomeScreen() {
  const t = useT();
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
    const grouped = new Map<string, { name: string; description?: string; programs: typeof catalog }>();

    for (const program of catalog) {
      for (const category of program.categories) {
        const entry = grouped.get(category.id) ?? {
          name: category.name,
          description: category.description,
          programs: [],
        };
        entry.programs.push(program);
        grouped.set(category.id, entry);
      }
    }

    return [...grouped.entries()];
  }, [catalog]);

  return (
    <View className="flex-1 bg-background">
      <BrandHeader />
      <View className="px-5 pb-2">
        <Text className="text-[28px] font-bold text-ink">{formatHelloGreeting(t, user?.name)}</Text>
        {getGivenAndFamilyName(user?.name) ? null : (
          <Text className="mt-1 text-sm text-muted">{t('home.readyToTrain')}</Text>
        )}
      </View>
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message={t('home.loadingPrograms')} /> : null}

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
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {continueItem && continueProgress && !dismissedContinue ? (
            <ContinueWatchBar
              program={continueItem}
              progress={continueProgress}
              lessonId={continueProgress.lastLessonId ?? continueProgress.completedLessonIds[0] ?? ''}
              lessonTitle={t('home.resumeLesson')}
              onDismiss={() => setDismissedContinue(true)}
            />
          ) : null}

          {startedPrograms.length === 0 && myItems.length === 0 && catalog.length === 0 ? (
            <View className="px-5">
              <EmptyState
                icon="barbell-outline"
                title={t('home.emptyTitle')}
                description={t('home.emptyDescription')}
              />
            </View>
          ) : null}

          <View className="gap-4 px-5 pb-2">
            <AcademyWorkoutsSection />
            <PersonalPerformanceCard />
          </View>

          <ProgramCarousel
            title={t('home.startedPrograms')}
            subtitle={t('home.startedProgramsSubtitle')}
            programs={startedPrograms}
            progressByProgramId={progressByProgramId}
          />

          <ProgramCarousel
            title={t('home.myItems')}
            subtitle={t('home.myItemsSubtitle')}
            programs={myItems}
            progressByProgramId={progressByProgramId}
          />

          {categoryRows.map(([categoryId, row]) => (
            <ProgramCarousel
              key={categoryId}
              title={row.name}
              subtitle={row.description}
              programs={row.programs}
              progressByProgramId={progressByProgramId}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
