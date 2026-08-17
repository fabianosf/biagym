import { GymScreen } from '@/features/workouts/components';
import { VideoPlayer } from '@/features/programs/components';
import type { WorkoutExercise } from '@/domain/workout';
import { getTrainingPlan } from '@/services';
import { MUSCLE_GROUP_LABELS } from '@/domain/workout';
import { isPlayableVideoUrl } from '@/shared/utils';
import { Button } from '@/shared/components';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function WorkoutExerciseScreen() {
  const router = useRouter();
  const { id, exerciseId } = useLocalSearchParams<{ id: string; exerciseId: string }>();
  const [item, setItem] = useState<WorkoutExercise | null>(null);

  useEffect(() => {
    if (typeof id !== 'string' || typeof exerciseId !== 'string') {
      return;
    }

    void getTrainingPlan(id).then((plan) => {
      setItem(plan?.exercises.find((entry) => entry.id === exerciseId) ?? null);
    });
  }, [exerciseId, id]);

  const load = item?.loadKg != null ? `${item.loadKg} kg` : 'Peso corporal';

  return (
    <GymScreen>
      <View className="flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-gymLine bg-gymCard"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-white" numberOfLines={1}>
          {item?.exercise.name ?? 'Exercício'}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
        {item && isPlayableVideoUrl(item.exercise.videoUrl) ? (
          <VideoPlayer
            videoUrl={item.exercise.videoUrl}
            appearance="dark"
            showCompletionHint={false}
          />
        ) : (
          <View className="rounded-2xl border border-gymLine bg-gymCard p-6">
            <Text className="text-gymMuted">Este exercício ainda não tem vídeo.</Text>
          </View>
        )}

        {item ? (
          <View className="rounded-2xl border border-gymLine bg-gymCard p-5">
            <Text className="text-xs uppercase tracking-[1.4px] text-primary">
              {MUSCLE_GROUP_LABELS[item.exercise.muscleGroup]}
            </Text>
            <Text className="mt-3 text-2xl font-bold text-white">
              {item.sets} × {item.reps}
            </Text>
            <Text className="mt-2 text-base text-gymMuted">
              Carga {load} · Descanso {item.restSeconds}s
            </Text>
            {item.exercise.description ? (
              <Text className="mt-3 text-sm leading-5 text-gymMuted">{item.exercise.description}</Text>
            ) : null}
            {item.notes ? (
              <Text className="mt-3 text-sm text-white">Obs.: {item.notes}</Text>
            ) : null}
          </View>
        ) : null}

        <Button label="Voltar para o treino" onPress={() => router.back()} />
      </ScrollView>
    </GymScreen>
  );
}
