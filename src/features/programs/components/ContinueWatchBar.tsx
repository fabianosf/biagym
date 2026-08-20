import type { ProgramSummary } from '@/domain';
import type { UserProgress } from '@/domain/progress';
import { AppImage } from '@/shared/components';
import { programDetailPath, programLessonPath } from '@/shared/constants/routes';
import { useT } from '@/shared/theme';
import { programCoverSource } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type ContinueWatchBarProps = {
  program: ProgramSummary;
  progress: UserProgress;
  lessonId: string;
  lessonTitle: string;
  onDismiss?: () => void;
};

export function ContinueWatchBar({
  program,
  progress,
  lessonId,
  lessonTitle,
  onDismiss,
}: ContinueWatchBarProps) {
  const router = useRouter();
  const t = useT();

  return (
    <Pressable
      onPress={() =>
        router.push(
          lessonId
            ? programLessonPath(program.id, lessonId)
            : programDetailPath(program.id),
        )
      }
      className="mx-5 mb-5 overflow-hidden rounded-2xl bg-primary active:opacity-90"
    >
      <View className="flex-row items-center p-2.5">
        <View className="relative mr-3 h-14 w-14 overflow-hidden rounded-xl">
          <AppImage
            source={programCoverSource(program.id, program.coverUrl)}
            uri={program.coverUrl}
            aspectRatio={1}
            className="h-14 w-14"
          />
          <View className="absolute inset-0 items-center justify-center bg-black/25">
            <Ionicons name="play" size={16} color="#FFFFFF" />
          </View>
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-[13px] font-semibold text-white">{t('home.continueWatching')}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-white/90">
            {program.title} · {lessonTitle}
          </Text>
          <Text className="mt-0.5 text-[11px] text-white/75">
            {t('home.percentComplete', { percent: String(Math.round(progress.percentComplete)) })}
          </Text>
        </View>
        {onDismiss ? (
          <Pressable onPress={onDismiss} hitSlop={10} className="p-2">
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
