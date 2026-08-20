import type { Program, ProgramSummary } from '@/domain';
import type { UserProgress } from '@/domain/progress';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppImage, Badge, GradientScrim, ProgressBar } from '@/shared/components/ui';
import { programDetailPath } from '@/shared/constants/routes';
import { useT } from '@/shared/theme';
import { formatProgramDuration } from '@/shared/utils';

type ProgramCardVariant = 'owned' | 'catalog';

type ProgramCardProps = {
  program: ProgramSummary | Program;
  hasAccess?: boolean;
  progress?: UserProgress | null;
  variant?: ProgramCardVariant;
  index?: number;
};

export function ProgramCard({
  program,
  hasAccess = false,
  progress,
  variant = 'catalog',
  index = 0,
}: ProgramCardProps) {
  const t = useT();
  const percent = progress?.percentComplete ?? 0;
  const categories = 'categories' in program ? program.categories : [];
  const totalLessons = 'totalLessons' in program ? program.totalLessons : 0;
  const totalDurationSeconds =
    'totalDurationSeconds' in program ? program.totalDurationSeconds : 0;
  const isOwned = variant === 'owned';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(420).springify()}>
      <Link href={programDetailPath(program.id)} asChild>
        <Pressable
          className="overflow-hidden rounded-card border border-line bg-surface active:opacity-95"
          accessibilityRole="button"
          accessibilityLabel={t('home.openProgram', { title: program.title })}
        >
          <View className="relative">
            <AppImage uri={program.coverUrl} aspectRatio={16 / 9} className="h-48" />
            <GradientScrim />
            <View className="absolute inset-x-0 bottom-0 p-4">
              <Badge
                label={
                  isOwned
                    ? t('home.myWorkoutBadge')
                    : hasAccess
                      ? t('program.granted')
                      : t('home.catalogBadge')
                }
                tone={isOwned ? 'primary' : 'neutral'}
              />
              <Text className="mt-3 text-xl font-semibold text-ink">{program.title}</Text>
              <Text className="mt-1 text-sm text-muted">{program.trainerName}</Text>
            </View>
          </View>

          <View className="p-4">
            <View className="flex-row flex-wrap gap-2">
              <Badge label={t(`programLevels.${program.level}`)} tone="cyan" />
              {categories.slice(0, 2).map((category) => (
                <Badge key={category.id} label={category.name} />
              ))}
            </View>

            <Text className="mt-3 text-sm text-muted">
              {t('home.programMeta', {
                lessons: String(totalLessons),
                duration: formatProgramDuration(totalDurationSeconds),
                weeks: String(program.durationWeeks),
              })}
            </Text>

            {progress ? (
              <View className="mt-4">
                <ProgressBar value={percent} showPercentage size="sm" />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}
