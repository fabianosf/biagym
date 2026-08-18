import { colors } from '@/shared/theme';
import { ExerciseRunCard, GymFinishButton, GymScreen } from '@/features/workouts/components';
import { useSessionClock } from '@/features/workouts/hooks/useSessionClock';
import { useWorkoutRunStore } from '@/features/workouts/store/workout-run.store';
import { getPlanMuscleGroupSubtitle, resolveDisplayedLoadKg } from '@/features/workouts/utils/format';
import type { TrainingPlan } from '@/domain/workout';
import { completeWorkoutSession, DATA_FETCH_TIMEOUT_MS, getTrainingPlan, withTimeout } from '@/services';
import { getDataErrorMessage } from '@/services';
import { useAuth } from '@/features/auth';
import { resolveRouteParam } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

/**
 * Isolado num componente próprio para que o tick de 1s do relógio não
 * re-renderize a tela inteira (e, com ela, a lista de exercícios) a cada
 * segundo durante todo o treino.
 */
function ElapsedTimeLabel({ planId }: { planId: string | undefined }) {
  const elapsed = useSessionClock(planId);
  return (
    <Text className="flex-1 text-center text-[22px] font-semibold text-white">{elapsed}</Text>
  );
}

type FinishSummary = {
  title: string;
  message: string;
};

function buildFinishSummary(plan: TrainingPlan, completedCount: number): FinishSummary {
  const total = plan.exercises.length;

  if (total === 0) {
    return {
      title: 'Treino registrado',
      message: `${plan.title} foi salvo. Quando a ficha tiver exercícios, eles aparecem para você executar.`,
    };
  }

  if (completedCount >= total) {
    return {
      title: 'Mandou bem!',
      message: `Você concluiu todos os ${total} exercícios de ${plan.title}. Descanse e hidrate.`,
    };
  }

  if (completedCount === 0) {
    return {
      title: 'Treino registrado',
      message: `${plan.title} foi salvo. Na próxima, marque cada exercício na lista quando fizer.`,
    };
  }

  return {
    title: 'Treino finalizado',
    message: `Você concluiu ${completedCount} de ${total} exercícios de ${plan.title}. Seu progresso foi salvo.`,
  };
}

export function WorkoutDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const planId = resolveRouteParam(params.id);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishSummary, setFinishSummary] = useState<FinishSummary | null>(null);
  const doneIds = useWorkoutRunStore((state) =>
    planId ? (state.completedByPlanId[planId] ?? []) : [],
  );
  const loadByItemId = useWorkoutRunStore((state) => state.loadByItemId);
  const markCompleted = useWorkoutRunStore((state) => state.markCompleted);
  const unmark = useWorkoutRunStore((state) => state.unmark);
  const clearPlan = useWorkoutRunStore((state) => state.clearPlan);
  const doneSet = useMemo(() => new Set(doneIds), [doneIds]);
  const currentIndex = useMemo(
    () => plan?.exercises.findIndex((item) => !doneSet.has(item.id)) ?? -1,
    [plan, doneSet],
  );
  const muscleSubtitle = useMemo(
    () => (plan ? getPlanMuscleGroupSubtitle(plan.exercises) : ''),
    [plan],
  );

  const load = useCallback(async () => {
    if (!planId) {
      setPlan(null);
      setError('Não encontramos este treino. Volte à lista e abra de novo.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await withTimeout(
        getTrainingPlan(planId),
        DATA_FETCH_TIMEOUT_MS,
        'O treino demorou demais para carregar. Tente novamente.',
      );
      if (!data) {
        setPlan(null);
        setError('Este treino não está disponível para você no momento.');
        return;
      }

      setPlan(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleDone = useCallback(
    (itemId: string) => {
      if (!planId) {
        return;
      }

      if (doneSet.has(itemId)) {
        unmark(planId, itemId);
        return;
      }

      markCompleted(planId, itemId);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    },
    [planId, doneSet, markCompleted, unmark],
  );

  const handleOpenExercise = useCallback(
    (item: TrainingPlan['exercises'][number]) => {
      if (!plan?.id || !item.id) {
        setError('Este exercício não está completo. Avise a treinadora.');
        return;
      }

      try {
        router.push(`/workouts/${plan.id}/exercises/${item.id}` as Href);
      } catch {
        setError('Não foi possível abrir este exercício. Tente de novo.');
      }
    },
    [plan?.id, router],
  );

  async function handleFinish() {
    if (!user || !plan) {
      return;
    }

    setIsFinishing(true);
    try {
      await withTimeout(
        completeWorkoutSession({
          userId: user.id,
          planId: plan.id,
          completedExerciseIds: [...doneIds],
        }),
        DATA_FETCH_TIMEOUT_MS,
        'Não foi possível finalizar o treino agora. Tente de novo.',
      );
      const summary = buildFinishSummary(plan, doneIds.length);
      clearPlan(plan.id);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // web / Expo Go sem haptics
      }
      setFinishSummary(summary);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <GymScreen>
      <LinearGradient
        colors={['rgba(245,196,0,0.16)', 'transparent']}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140 }}
      />

      <View className="relative z-10 flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        {finishSummary ? (
          <Text className="flex-1 text-center text-[22px] font-semibold text-white">
            Concluído
          </Text>
        ) : (
          <ElapsedTimeLabel planId={planId} />
        )}
        <View className="h-11 w-11 items-center justify-center">
          <Ionicons name="pulse-outline" size={20} color="#FFFFFF" />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator size="large" color={colors.gymAccent} />
          <Text className="mt-4 text-sm text-gymMuted">Carregando treino...</Text>
        </View>
      ) : finishSummary ? (
        <View className="flex-1 justify-center px-6 pb-10">
          <View className="items-center rounded-3xl bg-gymCard px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-gymAccent">
              <Ionicons name="checkmark" size={32} color="#111111" />
            </View>
            <Text className="mt-5 text-center text-2xl font-bold text-white">{finishSummary.title}</Text>
            <Text className="mt-3 text-center text-sm leading-6 text-gymMuted">
              {finishSummary.message}
            </Text>
          </View>
          <View className="mt-8 px-1">
            <Pressable
              onPress={() => router.back()}
              className="min-h-[56px] items-center justify-center rounded-full bg-gymAccent active:opacity-90"
            >
              <Text className="text-base font-bold text-gymOnAccent">Voltar aos treinos</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View className="px-5 pb-4 pt-1">
            <Text className="text-[32px] font-bold text-white">{plan?.title ?? 'Treino'}</Text>
            {muscleSubtitle ? (
              <Text className="mt-1 text-sm text-gymMuted">{muscleSubtitle}</Text>
            ) : plan?.description ? (
              <Text className="mt-1 text-sm text-gymMuted">{plan.description}</Text>
            ) : null}
          </View>

          <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-6">
            {error ? (
              <View className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <Text className="text-sm text-red-300">{error}</Text>
                <Pressable className="mt-3" onPress={() => void load()}>
                  <Text className="text-sm font-semibold text-gymAccent">Tentar novamente</Text>
                </Pressable>
              </View>
            ) : null}

            {plan && plan.exercises.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-gymLine bg-gymCard p-5">
                <Text className="text-base font-semibold text-white">Ficha ainda vazia</Text>
                <Text className="mt-2 text-sm leading-5 text-gymMuted">
                  A treinadora ainda não colocou exercícios neste treino. Avise ela para completar a
                  ficha.
                </Text>
              </View>
            ) : null}

            {plan?.exercises.map((item, index) => (
              <ExerciseRunCard
                key={item.id}
                item={item}
                index={index}
                done={doneSet.has(item.id)}
                isCurrent={index === currentIndex}
                displayLoadKg={resolveDisplayedLoadKg(item, loadByItemId[item.id])}
                onToggleDone={handleToggleDone}
                onPress={handleOpenExercise}
              />
            ))}
          </ScrollView>

          <GymFinishButton
            label="Finalizar treino"
            loading={isFinishing}
            disabled={!plan || Boolean(error && !plan)}
            onPress={() => void handleFinish()}
          />
        </>
      )}
    </GymScreen>
  );
}
