import { colors } from '@/shared/theme';
import {
  ExerciseMediaHero,
  GymFinishButton,
  GymScreen,
  LoadEditorModal,
  PrescriptionStatCard,
} from '@/features/workouts/components';
import { useResolvedExerciseVideoUrl } from '@/features/workouts/hooks/useResolvedExerciseVideoUrl';
import { useWorkoutRunStore } from '@/features/workouts/store/workout-run.store';
import { exerciseThumbnailSource } from '@/features/workouts/utils/exercise-media';
import { formatSetsReps, resolveDisplayedLoadKg } from '@/features/workouts/utils/format';
import type { WorkoutExercise } from '@/domain/workout';
import { DATA_FETCH_TIMEOUT_MS, getDataErrorMessage, getTrainingPlan, withTimeout } from '@/services';
import { isPlayableVideoUrl, resolveRouteParam } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

export function WorkoutExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; exerciseId?: string | string[] }>();
  const planId = resolveRouteParam(params.id);
  const exerciseId = resolveRouteParam(params.exerciseId);
  const [item, setItem] = useState<WorkoutExercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadEditorOpen, setLoadEditorOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const markCompleted = useWorkoutRunStore((state) => state.markCompleted);
  const setItemLoad = useWorkoutRunStore((state) => state.setItemLoad);
  const loadOverride = useWorkoutRunStore((state) =>
    exerciseId ? state.loadByItemId[exerciseId] : undefined,
  );

  const load = useCallback(async () => {
    if (!planId || !exerciseId) {
      setItem(null);
      setError('Exercício inválido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const plan = await withTimeout(
        getTrainingPlan(planId),
        DATA_FETCH_TIMEOUT_MS,
        'O exercício demorou demais para carregar. Tente novamente.',
      );
      const found = plan?.exercises.find((entry) => entry.id === exerciseId) ?? null;
      setItem(found);
      if (!found) {
        setError('Este exercício não está mais neste treino.');
      }
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, planId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setIsVideoPlaying(false);
  }, [exerciseId]);

  const displayedLoad = item ? resolveDisplayedLoadKg(item, loadOverride) : 0;
  const { videoUrl: resolvedVideoUrl, isResolving: isResolvingVideo } =
    useResolvedExerciseVideoUrl(item?.exercise);
  const hasVideo = !isResolvingVideo && isPlayableVideoUrl(resolvedVideoUrl);

  function handleComplete() {
    if (planId && exerciseId) {
      markCompleted(planId, exerciseId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }
    router.back();
  }

  return (
    <GymScreen>
      <LinearGradient
        colors={['rgba(245,196,0,0.20)', 'transparent']}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 160 }}
      />

      <View className="relative z-10 h-12 flex-row items-center px-4">
        <Pressable
          onPress={() => router.back()}
          className="absolute left-2 z-10 h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="flex-1 px-12 text-center text-lg font-semibold text-white" numberOfLines={1}>
          {item?.exercise?.name ?? 'Exercício'}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator size="large" color={colors.gymAccent} />
          <Text className="mt-4 text-sm text-gymMuted">Carregando exercício...</Text>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-6">
            {error ? (
              <View className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <Text className="text-sm text-red-300">{error}</Text>
                <Pressable className="mt-3" onPress={() => void load()}>
                  <Text className="text-sm font-semibold text-gymAccent">Tentar novamente</Text>
                </Pressable>
              </View>
            ) : null}

            {item ? (
              <>
                <ExerciseMediaHero
                  videoUrl={resolvedVideoUrl}
                  thumbnail={exerciseThumbnailSource(item.exercise)}
                  title={item.exercise?.name ?? 'Exercício'}
                  isResolvingVideo={isResolvingVideo}
                  isPlaying={isVideoPlaying}
                  onPlay={() => setIsVideoPlaying(true)}
                />

                <Text className="text-[28px] font-bold leading-8 text-white">
                  {item.exercise?.name ?? 'Exercício'}
                </Text>

                {hasVideo ? (
                  <Pressable
                    onPress={() => setIsVideoPlaying(true)}
                    className="flex-row items-center self-start gap-2 rounded-full bg-gymAccent/15 px-4 py-2.5 active:opacity-80"
                    accessibilityRole="button"
                    accessibilityLabel={`Assistir vídeo de ${item.exercise?.name ?? 'exercício'}`}
                  >
                    <Ionicons name="play-circle" size={18} color={colors.gymAccent} />
                    <Text className="text-sm font-semibold text-gymAccent">
                      Assistir vídeo do exercício
                    </Text>
                  </Pressable>
                ) : !isResolvingVideo ? (
                  <View className="flex-row items-center self-start gap-2 rounded-full bg-gymCard px-4 py-2.5">
                    <Ionicons name="videocam-off-outline" size={16} color={colors.gymMuted} />
                    <Text className="text-sm text-gymMuted">Sem vídeo deste exercício</Text>
                  </View>
                ) : null}

                <View className="flex-row gap-3">
                  <PrescriptionStatCard
                    label="Séries e Repetições"
                    value={formatSetsReps(item.sets, item.reps)}
                  />
                  <PrescriptionStatCard
                    label="Carga (kg)"
                    value={String(displayedLoad)}
                    editable
                    onPress={() => setLoadEditorOpen(true)}
                  />
                </View>

                {item.notes ? (
                  <Text className="text-sm leading-5 text-gymMuted">Obs.: {item.notes}</Text>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          {item ? (
            <GymFinishButton label="Concluir exercício" onPress={handleComplete} />
          ) : null}

          <LoadEditorModal
            visible={loadEditorOpen}
            currentLoadKg={displayedLoad}
            onClose={() => setLoadEditorOpen(false)}
            onSave={(loadKg) => {
              if (item) {
                setItemLoad(item.id, loadKg);
              }
            }}
          />
        </>
      )}
    </GymScreen>
  );
}
