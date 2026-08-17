import type { TrainingPlanSummary } from '@/domain/workout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

type WorkoutCardProps = {
  plan: TrainingPlanSummary;
  onPress: () => void;
};

export function WorkoutCard({ plan, onPress }: WorkoutCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-gymLine bg-gymCard px-5 py-6 active:opacity-85"
    >
      <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-primary">
        Academia
      </Text>
      <Text className="mt-2 text-3xl font-bold text-white">{plan.title}</Text>
      {plan.description ? (
        <Text className="mt-2 text-sm leading-5 text-gymMuted">{plan.description}</Text>
      ) : null}
      <View className="mt-4 flex-row items-center">
        <Ionicons name="barbell-outline" size={16} color="#A1A1AA" />
        <Text className="ml-2 text-sm text-gymMuted">
          {plan.exerciseCount} {plan.exerciseCount === 1 ? 'exercício' : 'exercícios'}
        </Text>
      </View>
    </Pressable>
  );
}
