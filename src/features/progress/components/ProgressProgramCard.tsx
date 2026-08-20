import type { ProgramWithProgress } from '@/domain/progress';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Badge, Card, ProgressBar } from '@/shared/components';
import { programDetailPath } from '@/shared/constants/routes';
import { useT } from '@/shared/theme';
import { formatRelativeAccessDate } from '@/shared/utils';

type ProgressProgramCardProps = {
  item: ProgramWithProgress;
};

const STATUS_TONE = {
  not_started: 'neutral',
  in_progress: 'warning',
  completed: 'primary',
} as const;

export function ProgressProgramCard({ item }: ProgressProgramCardProps) {
  const t = useT();
  const { program, progress, status } = item;
  const percent = progress?.percentComplete ?? 0;
  const completedCount = progress?.completedLessonIds.length ?? 0;
  const lastAccessedAt = progress?.lastAccessedAt;

  return (
    <Link href={programDetailPath(program.id)} asChild>
      <Pressable className="active:opacity-90">
        <Card>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-ink">{program.title}</Text>
              <Text className="mt-1 text-sm text-muted">{program.trainerName}</Text>
            </View>
            <Badge label={t(`progress.status.${status}`)} tone={STATUS_TONE[status]} />
          </View>

          <View className="mt-5">
            <ProgressBar value={percent} label={t('program.progress')} size="sm" />
          </View>

          <View className="mt-3 gap-1">
            <Text className="text-sm text-muted">
              {t(
                completedCount === 1 ? 'progress.lessonsCompletedOne' : 'progress.lessonsCompletedOther',
                { count: String(completedCount) },
              )}
            </Text>
            {lastAccessedAt ? (
              <Text className="text-xs text-faint">
                {t('progress.lastAccess', { date: formatRelativeAccessDate(lastAccessedAt) })}
              </Text>
            ) : null}
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
