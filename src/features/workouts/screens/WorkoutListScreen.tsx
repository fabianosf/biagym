import { GymScreen, WorkoutCard } from '@/features/workouts/components';
import type { TrainingPlanSummary } from '@/domain/workout';
import { getDataErrorMessage, listTrainingPlans } from '@/services';
import { APP_NAME } from '@/shared/constants/app';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

export function WorkoutListScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPlans(await listTrainingPlans({ publishedOnly: true }));
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <GymScreen>
      <View className="px-5 pb-4 pt-3">
        <Text className="text-xs font-bold uppercase tracking-[1.8px] text-primary">
          {APP_NAME}
        </Text>
        <Text className="mt-2 text-[32px] font-bold text-white">Meus Treinos</Text>
        <Text className="mt-1 text-sm text-gymMuted">Treino A, B, C — entre e execute.</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor="#E8573A"
          />
        }
      >
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

        {!isLoading && plans.length === 0 ? (
          <View className="rounded-3xl border border-gymLine bg-gymCard p-6">
            <Text className="text-lg font-semibold text-white">Nenhum treino liberado</Text>
            <Text className="mt-2 text-sm leading-5 text-gymMuted">
              Quando o treino for publicado e liberado para você, ele aparece aqui.
            </Text>
          </View>
        ) : (
          plans.map((plan) => (
            <WorkoutCard
              key={plan.id}
              plan={plan}
              onPress={() => router.push(`/workouts/${plan.id}` as Href)}
            />
          ))
        )}
      </ScrollView>
    </GymScreen>
  );
}
