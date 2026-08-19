import type { Program, ProgramSummary } from '@/domain';
import type { UserProgress } from '@/domain/progress';
import { AppImage, GradientScrim } from '@/shared/components/ui';
import { programDetailPath } from '@/shared/constants/routes';
import { programCoverSource } from '@/shared/utils';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type ProgramPosterCardProps = {
  program: ProgramSummary | Program;
  progress?: UserProgress | null;
  size?: 'md' | 'lg' | 'grid';
  index?: number;
};

export function ProgramPosterCard({
  program,
  progress,
  size = 'md',
  index = 0,
}: ProgramPosterCardProps) {
  const width = size === 'lg' ? 168 : 148;
  const height = size === 'lg' ? 236 : 210;
  const percent = progress?.percentComplete ?? 0;
  const isGrid = size === 'grid';

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(360).springify()}>
      <Link href={programDetailPath(program.id)} asChild>
        <Pressable
          style={isGrid ? { width: '100%' } : { width }}
          className="active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel={`Abrir programa ${program.title}`}
        >
          <View
            style={isGrid ? { width: '100%', aspectRatio: 3 / 4 } : { width, height }}
            className="overflow-hidden rounded-[18px] bg-surface"
          >
            <AppImage
              source={programCoverSource(program.id, program.coverUrl)}
              uri={program.coverUrl}
              aspectRatio={3 / 4}
              className="h-full w-full"
            />
            <GradientScrim />
            <View className="absolute inset-x-0 bottom-0 p-3">
              <Text numberOfLines={2} className="text-[15px] font-semibold leading-5 text-white">
                {program.title}
              </Text>
              {percent > 0 ? (
                <View className="mt-2 h-1 overflow-hidden rounded-full bg-white/30">
                  <View className="h-1 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}
