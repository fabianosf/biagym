import type { Lesson } from '@/domain/program';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { formatLessonDuration } from '@/shared/utils';

import type { LessonStatus } from '../utils/lesson-navigation';

type LessonItemProps = {
  lesson: Lesson;
  status: LessonStatus;
  onPress: () => void;
  isDownloaded?: boolean;
  isDownloading?: boolean;
};

export function LessonItem({
  lesson,
  status,
  onPress,
  isDownloaded = false,
  isDownloading = false,
}: LessonItemProps) {
  const isLocked = status === 'locked';

  return (
    <Pressable
      disabled={isLocked}
      onPress={onPress}
      className={`flex-row items-center rounded-2xl bg-surface px-2.5 py-2.5 ${
        isLocked ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      <View className="mr-3 h-14 w-[72px] items-center justify-center overflow-hidden rounded-xl bg-line">
        <Ionicons
          name={isLocked ? 'lock-closed' : 'play'}
          size={18}
          color={isLocked ? '#9B9B9B' : '#1A1A1A'}
        />
      </View>

      <View className="flex-1">
        <Text className="font-semibold text-ink">{lesson.title}</Text>
        <Text className="mt-0.5 text-xs text-muted">
          {formatLessonDuration(lesson.durationSeconds)}
          {lesson.isFreePreview ? ' · Prévia' : ''}
          {isDownloaded ? ' · Offline' : ''}
          {isDownloading ? ' · Baixando...' : ''}
          {status === 'completed' ? ' · Concluída' : ''}
        </Text>
      </View>

      {status !== 'locked' ? (
        <Ionicons name="download-outline" size={18} color="#1A1A1A" />
      ) : null}
    </Pressable>
  );
}
