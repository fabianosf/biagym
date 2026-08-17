import { AppImage } from '@/shared/components/ui/AppImage';
import type { WorkoutExercise } from '@/domain/workout';
import { exerciseThumbnailSource } from '@/features/workouts/utils/exercise-media';
import {
  formatIndexBadge,
  formatPrescriptionLine,
  formatRestClock,
} from '@/features/workouts/utils/format';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type ExerciseRunCardProps = {
  item: WorkoutExercise;
  index: number;
  done: boolean;
  isCurrent: boolean;
  displayLoadKg: number;
  onPress: () => void;
  onToggleDone: () => void;
};

export function ExerciseRunCard({
  item,
  index,
  done,
  isCurrent,
  displayLoadKg,
  onPress,
  onToggleDone,
}: ExerciseRunCardProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const isRestRunning = remaining != null;
  const restDisplay = formatRestClock(remaining ?? item.restSeconds);
  const thumbnail = exerciseThumbnailSource(item.exercise);

  useEffect(() => {
    if (remaining == null) {
      return;
    }

    if (remaining <= 0) {
      setRemaining(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      return;
    }

    const timer = setTimeout(() => {
      setRemaining((current) => (current == null ? null : current - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [remaining]);

  function handleRestPlay() {
    const rest = item.restSeconds ?? 0;
    if (rest <= 0) {
      return;
    }

    if (isRestRunning) {
      setRemaining(null);
      return;
    }

    setRemaining(rest);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }

  return (
    <View
      className={`overflow-hidden rounded-2xl bg-gymCard ${
        isCurrent && !done ? 'border border-white/25' : 'border border-transparent'
      } ${done ? 'opacity-70' : ''}`}
    >
      <Pressable onPress={onPress} className="flex-row items-center px-3 pb-3 pt-3 active:opacity-85">
        <Pressable
          onPress={onToggleDone}
          hitSlop={8}
          className={`mr-3 h-6 w-6 items-center justify-center rounded-md border ${
            done ? 'border-gymAccent bg-gymAccent' : 'border-white/35 bg-transparent'
          }`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? 'Desmarcar exercício' : 'Marcar exercício como concluído'}
        >
          {done ? <Ionicons name="checkmark" size={16} color="#111111" /> : null}
        </Pressable>

        <View className="mr-3 h-[96px] w-[76px] overflow-hidden rounded-2xl bg-black">
          <AppImage source={thumbnail} aspectRatio={76 / 96} contentFit="cover" className="bg-black" />
          <View className="absolute inset-0 items-center justify-center">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-black/50">
              <Ionicons name="play" size={14} color="#FFFFFF" />
            </View>
          </View>
          <View className="absolute left-1.5 top-1.5 rounded-md bg-[#2563EB] px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-white">{formatIndexBadge(index)}</Text>
          </View>
        </View>

        <View className="min-w-0 flex-1 pr-2">
          <Text className="text-base font-bold text-white" numberOfLines={1}>
            {item.exercise?.name ?? 'Exercício'}
          </Text>
          <Text className="mt-1 text-sm text-gymMuted" numberOfLines={1}>
            {formatPrescriptionLine(item.sets ?? 3, item.reps ?? '12', displayLoadKg)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </Pressable>

      <View className="flex-row items-center border-t border-white/10 px-4 py-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-white">{restDisplay}</Text>
          <Text className="text-[12px] text-gymMuted">(Descanso entre séries)</Text>
        </View>
        <Pressable
          onPress={handleRestPlay}
          className="h-9 w-9 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={isRestRunning ? 'Parar descanso' : 'Iniciar descanso'}
        >
          <Ionicons name={isRestRunning ? 'pause' : 'play'} size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

/** Compatível com usos antigos da lista. */
export function ExerciseRow(props: ExerciseRunCardProps) {
  return <ExerciseRunCard {...props} />;
}
