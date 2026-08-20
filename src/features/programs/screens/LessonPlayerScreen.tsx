import {
  MedicalDisclaimer,
  VideoPlayer,
} from '@/features/programs/components';
import {
  useLessonPlayer,
  useProgramDetail,
  useResolvedLessonVideoUrl,
} from '@/features/programs/hooks';
import { flattenLessons } from '@/features/programs/utils/lesson-navigation';
import {
  LessonDownloadButton,
  OfflineBanner,
  SyncStatusBanner,
} from '@/features/offline';
import { useOfflineSync } from '@/features/offline/hooks/useOfflineSync';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  ScreenHeader,
} from '@/shared/components';
import { useT } from '@/shared/theme';
import { isPlayableVideoUrl, resolveRouteParam } from '@/shared/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';

export function LessonPlayerScreen() {
  const router = useRouter();
  const t = useT();
  const params = useLocalSearchParams<{ id?: string | string[]; lessonId?: string | string[] }>();
  const programId = resolveRouteParam(params.id);
  const selectedLessonId = resolveRouteParam(params.lessonId);
  const { runSync } = useOfflineSync();

  const { detail, progress, hasAccess, isLoading, error, refetch, setProgress } =
    useProgramDetail(programId);

  const lesson = detail?.weeks
    .flatMap(({ lessons }) => lessons)
    .find((item) => item.id === selectedLessonId);

  const isLessonLocked = Boolean(lesson && !hasAccess && !lesson.isFreePreview);

  const totalLessons = detail ? flattenLessons(detail).length : 0;
  const wasAlreadyCompleted = Boolean(
    lesson && progress?.completedLessonIds.includes(lesson.id),
  );
  const { videoUrl: resolvedVideoUrl, isResolving: isResolvingVideo } = useResolvedLessonVideoUrl(
    lesson?.id,
    lesson?.videoUrl,
  );

  const {
    canMarkComplete,
    isCompleted,
    isMarking,
    markError,
    syncMessage,
    showDisclaimer,
    handlePlaybackProgress,
    handleAcceptDisclaimer,
    markComplete,
  } = useLessonPlayer({
    programId,
    lesson,
    totalLessons,
    currentProgress: progress,
    initiallyCompleted: wasAlreadyCompleted,
    onProgressUpdated: setProgress,
  });

  const lessonCompleted = wasAlreadyCompleted || isCompleted;
  const hasRemoteVideo = Boolean(lesson && isPlayableVideoUrl(lesson.videoUrl));
  const isOfflineVideo = Boolean(
    hasRemoteVideo && resolvedVideoUrl && lesson && resolvedVideoUrl !== lesson.videoUrl,
  );
  const isSampleFallback = Boolean(resolvedVideoUrl && !hasRemoteVideo);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={lesson?.title ?? t('lesson.fallbackTitle')}
        subtitle={detail?.program.title}
        showBack
        onBack={() => router.back()}
      />
      <OfflineBanner />
      <SyncStatusBanner onRetry={() => void runSync()} />

      {isLoading ? <LoadingIndicator fullScreen message={t('lesson.loading')} /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error && isLessonLocked ? (
        <View className="flex-1 px-5 pt-2">
          <EmptyState
            icon="lock-closed-outline"
            title={t('lesson.lockedTitle')}
            description={t('program.lockedDescription')}
          />
        </View>
      ) : null}

      {!isLoading && !error && lesson && programId && !isLessonLocked ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12 pt-2">
          {!showDisclaimer ? (
            <>
              {isResolvingVideo ? (
                <View className="aspect-video items-center justify-center rounded-card border border-line bg-elevated">
                  <Text className="text-sm text-muted">{t('lesson.loadingVideo')}</Text>
                </View>
              ) : resolvedVideoUrl ? (
                <VideoPlayer
                  videoUrl={resolvedVideoUrl}
                  onPlaybackProgress={handlePlaybackProgress}
                />
              ) : (
                <View className="aspect-video items-center justify-center rounded-card border border-line bg-elevated px-6">
                  <Text className="text-center text-sm leading-6 text-muted">
                    {t('lesson.noVideoYet')}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium text-muted">
                  {isOfflineVideo
                    ? t('lesson.offlineVersion')
                    : isSampleFallback
                      ? t('lesson.sampleVideo')
                      : t('lesson.onlineStreaming')}
                </Text>
                {hasRemoteVideo ? (
                  <LessonDownloadButton
                    lessonId={lesson.id}
                    programId={programId}
                    remoteUrl={lesson.videoUrl}
                  />
                ) : null}
              </View>

              {lesson.description ? (
                <Text className="text-sm leading-6 text-muted">{lesson.description}</Text>
              ) : null}

              {lessonCompleted ? (
                <Card className="items-center border-primary/20 bg-primary/10">
                  <Text className="text-lg font-semibold text-primary">{t('lesson.completedTitle')}</Text>
                  <Text className="mt-2 text-center text-sm text-muted">
                    {t('lesson.completedMessage')}
                  </Text>
                  {syncMessage ? (
                    <Text className="mt-2 text-center text-xs text-amber-200">{syncMessage}</Text>
                  ) : null}
                  <Button
                    className="mt-5 w-full"
                    label={t('lesson.backToProgram')}
                    onPress={() => router.back()}
                  />
                </Card>
              ) : (
                <View className="gap-3">
                  <Button
                    label={t('lesson.markComplete')}
                    onPress={() => void markComplete()}
                    disabled={!canMarkComplete}
                    loading={isMarking}
                  />
                  {!canMarkComplete && resolvedVideoUrl ? (
                    <Text className="text-center text-xs leading-5 text-faint">
                      {t('lesson.watch80Hint')}
                    </Text>
                  ) : null}
                  <Button
                    variant="ghost"
                    label={t('lesson.completeManually')}
                    onPress={() => {
                      if (canMarkComplete) {
                        void markComplete();
                        return;
                      }

                      Alert.alert(
                        t('lesson.notFullyWatchedTitle'),
                        t('lesson.notFullyWatchedMessage'),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('lesson.completeAnyway'), onPress: () => void markComplete() },
                        ],
                      );
                    }}
                    disabled={isMarking}
                  />
                </View>
              )}

              {markError ? (
                <Text className="text-center text-sm text-red-400">{markError}</Text>
              ) : null}
              {!lessonCompleted && syncMessage ? (
                <Text className="text-center text-xs text-amber-200">{syncMessage}</Text>
              ) : null}
            </>
          ) : (
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-center text-muted">{t('lesson.acceptDisclaimer')}</Text>
            </View>
          )}
        </ScrollView>
      ) : null}

      {!isLoading && !error && !lesson && !isLessonLocked ? (
        <View className="flex-1 px-5 pt-2">
          <EmptyState
            title={t('lesson.notFoundTitle')}
            description={t('lesson.notFoundDescription')}
          />
        </View>
      ) : null}

      <MedicalDisclaimer
        visible={showDisclaimer}
        onAccept={() => void handleAcceptDisclaimer()}
        onDismiss={() => router.back()}
      />
    </View>
  );
}
