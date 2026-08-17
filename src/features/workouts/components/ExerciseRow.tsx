import { MUSCLE_GROUP_LABELS, type WorkoutExercise } from '@/domain/workout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type ExerciseRowProps = {
  item: WorkoutExercise;
  onPress: () => void;
  done?: boolean;
};

export function ExerciseRow({ item, onPress, done = false }: ExerciseRowProps) {
  const load = item.loadKg != null ? `${item.loadKg} kg` : 'Peso corporal';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl border border-gymLine bg-gymCard px-4 py-4 active:opacity-80"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-primary/20">
        <Ionicons name={done ? 'checkmark' : 'play'} size={20} color="#E8573A" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-white">{item.exercise.name}</Text>
        <Text className="mt-1 text-xs text-gymMuted">
          {item.sets} × {item.reps} · {load} · {item.restSeconds}s descanso
        </Text>
        <Text className="mt-0.5 text-[11px] uppercase tracking-[1.2px] text-primary">
          {MUSCLE_GROUP_LABELS[item.exercise.muscleGroup]}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
    </Pressable>
  );
}
