import { useAuth } from '@/features/auth';
import { useWorkoutRunStore } from '@/features/workouts/store/workout-run.store';
import type { TrainingPlanSummary, WorkoutSession } from '@/domain/workout';
import { listTrainingPlans, listWorkoutSessions } from '@/services';
import { Button, Card } from '@/shared/components';
import { routes } from '@/shared/constants/routes';
import { formatRelativeAccessDate } from '@/shared/utils';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function AcademyWorkoutsSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const completedByPlanId = useWorkoutRunStore((state) => state.completedByPlanId);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const [plansData, sessionsData] = await Promise.all([
        listTrainingPlans({ publishedOnly: true }),
        listWorkoutSessions(user.id, 10),
      ]);
      setPlans(plansData);
      setSessions(sessionsData);
    } catch {
      setPlans([]);
      setSessions([]);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (plans.length === 0 && sessions.length === 0) {
    return null;
  }

  const now = Date.now();
  const sessionsThisWeek = sessions.filter(
    (session) => now - new Date(session.completedAt).getTime() < WEEK_MS,
  ).length;

  const inProgress = plans.filter((plan) => {
    const done = completedByPlanId[plan.id]?.length ?? 0;
    return done > 0 && done < plan.exerciseCount;
  });

  const lastSession = sessions[0];
  const lastSessionPlan = lastSession ? plans.find((plan) => plan.id === lastSession.planId) : undefined;

  return (
    <Card>
      <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
        Treinos da academia
      </Text>

      <View className="mt-3 flex-row gap-4">
        <View>
          <Text className="text-2xl font-semibold text-ink">{plans.length}</Text>
          <Text className="text-xs text-muted">
            {plans.length === 1 ? 'treino liberado' : 'treinos liberados'}
          </Text>
        </View>
        <View>
          <Text className="text-2xl font-semibold text-primary">{sessionsThisWeek}</Text>
          <Text className="text-xs text-muted">
            {sessionsThisWeek === 1 ? 'concluído essa semana' : 'concluídos essa semana'}
          </Text>
        </View>
      </View>

      {inProgress.length > 0 ? (
        <View className="mt-4 gap-2">
          {inProgress.map((plan) => {
            const done = completedByPlanId[plan.id]?.length ?? 0;
            return (
              <Pressable
                key={plan.id}
                onPress={() => router.push(`/workouts/${plan.id}` as Href)}
                className="flex-row items-center justify-between rounded-2xl border border-line bg-elevated px-3 py-3"
              >
                <Text className="flex-1 text-sm text-ink">{plan.title}</Text>
                <Text className="text-xs font-semibold text-primary">
                  {done} de {plan.exerciseCount}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {lastSession ? (
        <Text className="mt-3 text-sm text-muted">
          Último treino: {lastSessionPlan?.title ?? 'Treino'} ·{' '}
          {formatRelativeAccessDate(lastSession.completedAt)}
        </Text>
      ) : null}

      <Button
        className="mt-4"
        variant="secondary"
        label="Ver meus treinos"
        onPress={() => router.push(routes.workouts as Href)}
      />
    </Card>
  );
}
