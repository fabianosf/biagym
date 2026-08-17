import { WeekLessonList } from '@/features/programs/components';
import { useProgramDetail } from '@/features/programs/hooks';
import {
  getContinueLesson,
  getLastAccessedLesson,
  countAccessibleLessons,
  countCompletedAccessibleLessons,
  getLessonStatus,
} from '@/features/programs/utils/lesson-navigation';
import { OfflineBanner, SyncStatusBanner } from '@/features/offline';
import { useOfflineSync } from '@/features/offline/hooks/useOfflineSync';
import {
  AppImage,
  Badge,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  ProgressBar,
  ScreenHeader,
  SectionHeader,
} from '@/shared/components';
import { programLessonPath } from '@/shared/constants/routes';
import { programCoverSource } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export function ProgramDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = typeof id === 'string' ? id : undefined;
  const { runSync } = useOfflineSync();

  const {
    detail,
    progress,
    hasAccess,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useProgramDetail(programId);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const continueLesson = detail ? getContinueLesson(detail, progress, hasAccess) : null;
  const lastAccessedLesson = detail
    ? getLastAccessedLesson(detail, progress, hasAccess)
    : null;
  const completedLessonIds = progress?.completedLessonIds ?? [];
  const percentComplete = progress?.percentComplete ?? 0;

  const accessibleTotal = detail
    ? countAccessibleLessons(detail, hasAccess)
    : 0;
  const accessibleCompleted = detail
    ? countCompletedAccessibleLessons(detail, completedLessonIds, hasAccess)
    : 0;

  function handleLessonPress(lessonId: string) {
    if (!programId || !detail) {
      return;
    }

    const lesson = detail.weeks
      .flatMap(({ lessons }) => lessons)
      .find((item) => item.id === lessonId);

    if (!lesson) {
      return;
    }

    const status = getLessonStatus(
      lesson,
      completedLessonIds,
      hasAccess,
      continueLesson?.id,
    );

    if (status === 'locked') {
      return;
    }

    router.push(programLessonPath(programId, lessonId));
  }

  function handleContinuePress() {
    if (!continueLesson) {
      return;
    }

    handleLessonPress(continueLesson.id);
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={detail?.program.title ?? 'Programa'}
        subtitle={detail?.program.trainerName}
        showBack
        onBack={() => router.back()}
      />
      <OfflineBanner />
      <SyncStatusBanner onRetry={() => void runSync()} />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando programa..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error && detail && programId ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-6 px-5 pb-12 pt-2"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refetch()}
              tintColor="#E8573A"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View className="mb-2 flex-row flex-wrap gap-2">
              <Badge
                label={hasAccess ? 'Liberado' : 'Acesso necessário'}
                tone={hasAccess ? 'primary' : 'warning'}
              />
              <Badge label={detail.program.level} />
            </View>
            <Text className="text-[32px] font-bold leading-9 text-ink">{detail.program.title}</Text>
            <Text className="mt-2 text-sm text-muted">
              {detail.program.durationWeeks} sem. · {detail.program.level} · {detail.program.trainerName}
            </Text>
            <Text className="mt-3 text-base leading-6 text-ink">{detail.program.description}</Text>
            <View className="mt-4 flex-row items-center">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-primary">
                <Text className="text-xs font-bold text-white">
                  {detail.program.trainerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="font-medium text-ink">{detail.program.trainerName}</Text>
            </View>
          </View>

          {continueLesson ? (
            <View>
              <Text className="mb-3 text-lg font-bold text-ink">Comece por aqui</Text>
              <Pressable
                onPress={handleContinuePress}
                className="overflow-hidden rounded-2xl bg-surface active:opacity-90"
              >
                <View className="relative">
                  <AppImage
                    source={programCoverSource(detail.program.id, detail.program.coverUrl)}
                    uri={detail.program.coverUrl}
                    aspectRatio={16 / 9}
                  />
                  <View className="absolute inset-0 items-center justify-center bg-black/20">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                      <Ionicons name="play" size={22} color="#1A1A1A" />
                    </View>
                  </View>
                </View>
                <Text className="px-4 py-3 font-semibold text-ink">{continueLesson.title}</Text>
              </Pressable>
            </View>
          ) : null}

          {lastAccessedLesson && continueLesson?.id !== lastAccessedLesson.id ? (
            <Text className="text-sm text-muted">Última aula: {lastAccessedLesson.title}</Text>
          ) : null}

          <View>
            <Text className="mb-3 text-lg font-bold text-ink">Progresso</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-surface p-4">
                <Text className="text-sm text-muted">Conclusão</Text>
                <Text className="mt-2 text-3xl font-bold text-ink">{Math.round(percentComplete)}%</Text>
                <View className="mt-3">
                  <ProgressBar value={percentComplete} showPercentage={false} size="sm" />
                </View>
              </View>
              <View className="flex-1 rounded-2xl bg-surface p-4">
                <Text className="text-sm text-muted">Aulas assistidas</Text>
                <Text className="mt-2 text-3xl font-bold text-ink">{accessibleCompleted}</Text>
                <Text className="mt-1 text-xs text-faint">de {accessibleTotal}</Text>
              </View>
            </View>
          </View>

          <View>
            <SectionHeader title="Estrutura do programa" subtitle="Semanas, aulas e status" />
            {!hasAccess &&
            detail.weeks.every(({ lessons }) =>
              lessons.every((lesson) => !lesson.isFreePreview),
            ) ? (
              <EmptyState
                title="Conteúdo bloqueado"
                description="Peça ao administrador para liberar o acesso a este programa."
              />
            ) : (
              <WeekLessonList
                programId={programId}
                weeks={detail.weeks}
                completedLessonIds={completedLessonIds}
                hasFullAccess={hasAccess}
                activeLessonId={continueLesson?.id}
                onLessonPress={handleLessonPress}
              />
            )}
          </View>
        </ScrollView>
      ) : null}

      {!isLoading && !error && !detail && programId ? (
        <View className="flex-1 px-5 pt-2">
          <EmptyState
            title="Programa não encontrado"
            description="Verifique se o programa ainda está disponível no catálogo."
          />
        </View>
      ) : null}
    </View>
  );
}
