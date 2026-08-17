import { ExerciseRow, GymScreen } from '@/features/workouts/components';
import type { TrainingPlan } from '@/domain/workout';
import { completeWorkoutSession, getTrainingPlan } from '@/services';
import { getDataErrorMessage } from '@/services';
import { useAuth } from '@/features/auth';
import { Button } from '@/shared/components';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

export function WorkoutDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const planId = typeof id === 'string' ? id : undefined;
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const load = useCallback(async () => {
    if (!planId) {
      return;
    }

    try {
      setPlan(await getTrainingPlan(planId));
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFinish() {
    if (!user || !plan) {
      return;
    }

    setIsFinishing(true);
    try {
      await completeWorkoutSession({
        userId: user.id,
        planId: plan.id,
        completedExerciseIds: [...doneIds],
      });
      Alert.alert('Treino finalizado', 'Boa. Seu treino foi registrado.');
      router.back();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <GymScreen>
      <View className="flex-row items-center px-5 pb-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-gymLine bg-gymCard"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            Executar
          </Text>
          <Text className="text-2xl font-bold text-white">{plan?.title ?? 'Treino'}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-28">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        {plan?.description ? (
          <Text className="mb-2 text-sm leading-5 text-gymMuted">{plan.description}</Text>
        ) : null}
        {plan?.exercises.map((item) => (
          <ExerciseRow
            key={item.id}
            item={item}
            done={doneIds.has(item.id)}
            onPress={() => {
              setDoneIds((current) => new Set(current).add(item.id));
              router.push(`/workouts/${plan.id}/exercises/${item.id}` as Href);
            }}
          />
        ))}
      </ScrollView>

      <View className="border-t border-gymLine bg-gym px-5 py-4">
        <Button
          label="Finalizar treino"
          loading={isFinishing}
          onPress={() => void handleFinish()}
        />
      </View>
    </GymScreen>
  );
}
