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
import { isPlayableVideoUrl, resolveRouteParam } from '@/shared/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export function LessonPlayerScreen() {
  const router = useRouter();
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
        title={lesson?.title ?? 'Aula'}
        subtitle={detail?.program.title}
        showBack
        onBack={() => router.back()}
      />
      <OfflineBanner />
      <SyncStatusBanner onRetry={() => void runSync()} />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando aula..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error && isLessonLocked ? (
        <View className="flex-1 px-5 pt-2">
          <EmptyState
            icon="lock-closed-outline"
            title="Aula bloqueada"
            description="Peça à treinadora para liberar o acesso a este programa."
          />
        </View>
      ) : null}

      {!isLoading && !error && lesson && programId && !isLessonLocked ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12 pt-2">
          {!showDisclaimer ? (
            <>
              {isResolvingVideo ? (
                <View className="aspect-video items-center justify-center rounded-card border border-line bg-elevated">
                  <Text className="text-sm text-muted">Carregando vídeo...</Text>
                </View>
              ) : resolvedVideoUrl ? (
                <VideoPlayer
                  videoUrl={resolvedVideoUrl}
                  onPlaybackProgress={handlePlaybackProgress}
                />
              ) : (
                <View className="aspect-video items-center justify-center rounded-card border border-line bg-elevated px-6">
                  <Text className="text-center text-sm leading-6 text-muted">
                    Ainda não há vídeo nesta aula. No painel admin, abra a aula e envie um MP4 da
                    pasta videos/.
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium text-muted">
                  {isOfflineVideo
                    ? 'Versão offline'
                    : isSampleFallback
                      ? 'Vídeo de exemplo da pasta videos/'
                      : 'Streaming online'}
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
                  <Text className="text-lg font-semibold text-primary">Aula concluída</Text>
                  <Text className="mt-2 text-center text-sm text-muted">
                    Seu progresso foi atualizado. Continue para a próxima aula.
                  </Text>
                  {syncMessage ? (
                    <Text className="mt-2 text-center text-xs text-amber-200">{syncMessage}</Text>
                  ) : null}
                  <Button
                    className="mt-5 w-full"
                    label="Voltar ao programa"
                    onPress={() => router.back()}
                  />
                </Card>
              ) : (
                <View className="gap-3">
                  <Button
                    label="Marcar como concluída"
                    onPress={() => void markComplete()}
                    disabled={!canMarkComplete}
                    loading={isMarking}
                  />
                  {!canMarkComplete && resolvedVideoUrl ? (
                    <Text className="text-center text-xs leading-5 text-faint">
                      Assista pelo menos 80% do vídeo para liberar a conclusão automática.
                    </Text>
                  ) : null}
                  <Button
                    variant="ghost"
                    label="Concluir manualmente agora"
                    onPress={() => void markComplete()}
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
              <Text className="text-center text-muted">
                Aceite o aviso médico para iniciar a aula.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : null}

      {!isLoading && !error && !lesson && !isLessonLocked ? (
        <View className="flex-1 px-5 pt-2">
          <EmptyState
            title="Aula não encontrada"
            description="Esta aula pode estar bloqueada ou indisponível."
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
