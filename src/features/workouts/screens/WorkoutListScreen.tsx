import { colors } from '@/shared/theme';
import { GymScreen, WorkoutCard } from '@/features/workouts/components';
import type { TrainingPlanSummary } from '@/domain/workout';
import { DATA_FETCH_TIMEOUT_MS, getDataErrorMessage, listTrainingPlans, withTimeout } from '@/services';
import { APP_NAME } from '@/shared/constants/app';
import { EmptyState } from '@/shared/components';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

export function WorkoutListScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
      const data = await withTimeout(
        listTrainingPlans({ publishedOnly: true }),
        DATA_FETCH_TIMEOUT_MS,
        'Os treinos demoraram demais para carregar. Tente novamente.',
      );
      setPlans(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <GymScreen>
      <View className="px-5 pb-4 pt-3">
        <Text className="text-xs font-bold uppercase tracking-[1.8px] text-primary">
          {APP_NAME}
        </Text>
        <Text className="mt-2 text-[32px] font-bold text-white">Meus Treinos</Text>
        <Text className="mt-1 text-sm text-gymMuted">
          Treinos liberados para você. Toque para executar.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-sm text-gymMuted">Carregando treinos...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
              tintColor={colors.primary}
            />
          }
        >
          {error ? (
            <View className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
              <Text className="text-sm leading-5 text-red-300">{error}</Text>
              <Pressable className="mt-3" onPress={() => void load(false)}>
                <Text className="text-sm font-semibold text-primary">Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {!error && plans.length === 0 ? (
            <EmptyState
              tone="dark"
              icon="barbell-outline"
              title="Nenhum treino liberado ainda"
              description="Quando a treinadora liberar o Treino A, B ou C para você, ele aparece aqui. Puxe a tela para baixo para atualizar."
            />
          ) : null}

          {!error
            ? plans.map((plan) => (
                <WorkoutCard
                  key={plan.id}
                  plan={plan}
                  onPress={() => {
                    if (!plan.id) {
                      setError('Este treino está incompleto. Avise a treinadora.');
                      return;
                    }

                    try {
                      router.push(`/workouts/${plan.id}` as Href);
                    } catch {
                      setError('Não foi possível abrir este treino. Tente de novo.');
                    }
                  }}
                />
              ))
            : null}
        </ScrollView>
      )}
    </GymScreen>
  );
}
