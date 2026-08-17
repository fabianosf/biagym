import type { WeekWithLessons } from '@/domain/program';
import { LessonDownloadButton } from '@/features/offline';
import { useOfflineStore } from '@/features/offline/store/offline.store';
import { isLessonDownloaded } from '@/services';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ProgressBar } from '@/shared/components/ui/ProgressBar';

import { LessonItem } from './LessonItem';
import type { LessonStatus } from '../utils/lesson-navigation';
import { getLessonStatus } from '../utils/lesson-navigation';

type WeekLessonListProps = {
  programId: string;
  weeks: readonly WeekWithLessons[];
  completedLessonIds: readonly string[];
  hasFullAccess: boolean;
  activeLessonId?: string;
  onLessonPress: (lessonId: string) => void;
};

export function WeekLessonList({
  programId,
  weeks,
  completedLessonIds,
  hasFullAccess,
  activeLessonId,
  onLessonPress,
}: WeekLessonListProps) {
  const downloadStates = useOfflineStore((state) => state.downloadStates);
  const [downloadedLessonIds, setDownloadedLessonIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const lessonIds = weeks.flatMap(({ lessons }) => lessons.map((lesson) => lesson.id));
      const entries = await Promise.all(
        lessonIds.map(async (lessonId) => [lessonId, await isLessonDownloaded(lessonId)] as const),
      );

      if (!cancelled) {
        setDownloadedLessonIds(Object.fromEntries(entries));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weeks, downloadStates]);

  const hasVisibleLessons = weeks.some(({ lessons }) =>
    lessons.some((lesson) => hasFullAccess || lesson.isFreePreview),
  );

  if (weeks.length === 0 || !hasVisibleLessons) {
    return (
      <View className="rounded-card border border-line bg-surface p-5">
        <Text className="text-muted">
          Nenhuma aula disponível neste programa. Peça à treinadora para cadastrar o conteúdo ou
          liberar o acesso.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {weeks.map(({ week, lessons }) => {
        const visibleLessons = lessons.filter(
          (lesson) => hasFullAccess || lesson.isFreePreview,
        );

        if (visibleLessons.length === 0) {
          return null;
        }

        const completedInWeek = visibleLessons.filter((lesson) =>
          completedLessonIds.includes(lesson.id),
        ).length;
        const weekProgress = (completedInWeek / visibleLessons.length) * 100;

        return (
          <View key={week.id} className="mb-2">
            <View className="px-1 py-3">
              <Text className="text-base font-bold text-ink">
                Semana {week.weekNumber}
                {week.title ? ` · ${week.title}` : ''}
              </Text>
              <View className="mt-3">
                <ProgressBar
                  value={weekProgress}
                  label={`${completedInWeek}/${visibleLessons.length} aulas`}
                  size="sm"
                />
              </View>
            </View>

            <View className="gap-2">
              {visibleLessons.map((lesson) => {
                const status: LessonStatus = getLessonStatus(
                  lesson,
                  completedLessonIds,
                  hasFullAccess,
                  activeLessonId,
                );
                const downloadState = downloadStates[lesson.id] ?? 'idle';
                const isDownloaded =
                  downloadState === 'downloaded' || downloadedLessonIds[lesson.id] === true;
                const isDownloading = downloadState === 'downloading';

                return (
                  <View key={lesson.id} className="gap-1">
                    <LessonItem
                      lesson={lesson}
                      status={status}
                      onPress={() => onLessonPress(lesson.id)}
                      isDownloaded={isDownloaded}
                      isDownloading={isDownloading}
                    />
                    {status !== 'locked' ? (
                      <View className="px-3 pb-2">
                        <LessonDownloadButton
                          lessonId={lesson.id}
                          programId={programId}
                          remoteUrl={lesson.videoUrl}
                          compact
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
