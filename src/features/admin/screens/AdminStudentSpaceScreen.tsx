import {
  AdminShell,
  AdminStudentActionCard,
  AdminStudentAvatar,
} from '@/features/admin/components';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import { STUDENT_GOAL_LABELS, type StudentProfile } from '@/domain/student';
import type { TrainingPlanGrant, TrainingPlanSummary } from '@/domain/workout';
import {
  DATA_FETCH_TIMEOUT_MS,
  getDataErrorMessage,
  getStudentProfileById,
  grantTrainingPlanAccess,
  listTrainingPlanGrantsForUser,
  listTrainingPlans,
  revokeTrainingPlanAccess,
  withTimeout,
} from '@/services';
import { EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { resolveRouteParam } from '@/shared/utils';
import { buildWhatsAppUrl, formatPhoneDisplay } from '@/shared/utils/phone';
import { useStudentPinsStore } from '@/features/admin/store/student-pins.store';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

type AssignedPlan = {
  plan: TrainingPlanSummary;
  grant: TrainingPlanGrant;
};

export function AdminStudentSpaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const studentId = resolveRouteParam(params.id);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [grants, setGrants] = useState<TrainingPlanGrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const markOpened = useStudentPinsStore((state) => state.markOpened);
  const requestIdRef = useRef(0);

  const load = useCallback(async (silent = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!studentId) {
      setStudent(null);
      setError('Aluno inválido.');
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [profile, catalog, studentGrants] = await withTimeout(
        Promise.all([
          getStudentProfileById(studentId),
          listTrainingPlans(),
          listTrainingPlanGrantsForUser(studentId),
        ]),
        DATA_FETCH_TIMEOUT_MS,
        'O espaço do aluno demorou demais para carregar. Tente novamente.',
      );
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStudent(profile);
      setPlans(catalog);
      setGrants(studentGrants);
      if (!profile) {
        setError('Este aluno não está cadastrado.');
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(getDataErrorMessage(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      void load();
      if (user?.id && studentId) {
        markOpened(user.id, studentId);
      }
    }, [load, markOpened, studentId, user?.id]),
  );

  const assigned = useMemo((): AssignedPlan[] => {
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    return grants.flatMap((grant) => {
      const plan = planById.get(grant.planId);
      return plan ? [{ plan, grant }] : [];
    });
  }, [grants, plans]);

  const available = useMemo(() => {
    const grantedIds = new Set(grants.map((grant) => grant.planId));
    return plans.filter((plan) => !grantedIds.has(plan.id));
  }, [grants, plans]);

  async function handleGrant(plan: TrainingPlanSummary) {
    if (!user || !student) {
      return;
    }

    setBusyPlanId(plan.id);
    setError(null);
    setNotice(null);
    try {
      await grantTrainingPlanAccess({
        userId: student.userId,
        planId: plan.id,
        grantedBy: user.id,
      });
      setNotice(`${plan.title} liberado. Só ${student.name} vê este treino.`);
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  }

  async function handleRevoke(assignedPlan: AssignedPlan) {
    setBusyPlanId(assignedPlan.plan.id);
    setError(null);
    setNotice(null);
    try {
      await revokeTrainingPlanAccess(assignedPlan.grant.id);
      setNotice(`${assignedPlan.plan.title} removido deste aluno.`);
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  }

  const firstName = student ? getStudentFirstName(student.name) : 'este aluno';

  return (
    <AdminShell
      title={student?.name ?? 'Espaço do aluno'}
      subtitle={`Ambiente de ${firstName}. O que você fizer aqui é só deste aluno.`}
      showBack
      onBack={() => router.replace(adminRoutes.home as Href)}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando espaço do aluno..." /> : null}

      {!isLoading && error && !student ? (
        <View className="flex-1 px-5">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading && student ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

          <View className="rounded-card border border-line bg-surface p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
              Dados do aluno
            </Text>
            <View className="mt-3 flex-row items-center gap-4">
              <AdminStudentAvatar student={student} size={64} />
              <View className="min-w-0 flex-1">
                <Text className="text-lg font-semibold text-ink">{student.name}</Text>
                <Text className="mt-0.5 text-sm text-muted">{student.email}</Text>
              </View>
            </View>
            {student.metrics ? (
              <View className="mt-4 flex-row flex-wrap gap-2">
                <MetricChip label={`${student.metrics.weightKg} kg`} />
                <MetricChip label={`${student.metrics.heightCm} cm`} />
                <MetricChip label={`${student.metrics.age} anos`} />
                <MetricChip label={STUDENT_GOAL_LABELS[student.metrics.goal]} />
              </View>
            ) : (
              <Text className="mt-4 text-sm text-faint">Ainda não preencheu o onboarding físico.</Text>
            )}
            {student.phone ? (
              <Pressable
                onPress={() => {
                  const url = buildWhatsAppUrl(student.phone ?? '');
                  if (url) {
                    void Linking.openURL(url);
                  }
                }}
                className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-primary">
                  WhatsApp {formatPhoneDisplay(student.phone)}
                </Text>
                <Text className="mt-0.5 text-xs text-muted">Abrir conversa com {firstName}</Text>
              </Pressable>
            ) : (
              <Text className="mt-4 text-sm text-faint">WhatsApp ainda não informado.</Text>
            )}
          </View>

          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            Resolver para {firstName}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <AdminStudentActionCard
              title="Treinos"
              description={`Liberar ou montar ficha só para ${firstName}`}
              icon="barbell-outline"
              onPress={() =>
                router.push(adminRoutes.workoutsFor(student.userId) as Href)
              }
            />
            <AdminStudentActionCard
              title="Exercícios / vídeos"
              description="Cadastrar movimento e vídeo para a ficha"
              icon="videocam-outline"
              onPress={() =>
                router.push(adminRoutes.exercisesFor(student.userId) as Href)
              }
            />
            <AdminStudentActionCard
              title="Nutrição"
              description={`Plano alimentar só para ${firstName}`}
              icon="nutrition-outline"
              onPress={() =>
                router.push(adminRoutes.nutritionFor(student.userId) as Href)
              }
            />
            <AdminStudentActionCard
              title="Dicas / recados"
              description={`Mandar orientação só para ${firstName}`}
              icon="chatbubbles-outline"
              onPress={() =>
                router.push(adminRoutes.messagesFor(student.userId) as Href)
              }
            />
          </View>

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            Treinos de {firstName}
          </Text>
          {assigned.length === 0 ? (
            <Text className="text-sm text-muted">
              Nenhum treino liberado. Enquanto isso, {firstName} vê a lista vazia.
            </Text>
          ) : (
            assigned.map((item) => (
              <View
                key={item.grant.id}
                className="flex-row items-center rounded-card border border-line bg-surface p-4"
              >
                <Pressable
                  onPress={() =>
                    router.push(adminRoutes.workoutDetail(item.plan.id, student.userId) as Href)
                  }
                  className="min-w-0 flex-1 pr-3"
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.plan.title} de ${student.name}`}
                >
                  <Text className="font-semibold text-ink">{item.plan.title}</Text>
                  <Text className="mt-0.5 text-sm text-muted">
                    Só {firstName} vê · {item.plan.exerciseCount}{' '}
                    {item.plan.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleRevoke(item)}
                  disabled={busyPlanId === item.plan.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${item.plan.title} de ${student.name}`}
                  hitSlop={8}
                >
                  <Text className="text-sm font-semibold text-red-500">Remover</Text>
                </Pressable>
              </View>
            ))
          )}

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            Liberar para {firstName}
          </Text>
          <Text className="text-sm text-muted">
            Fichas prontas da academia. Liberar aqui não mistura outros alunos.
          </Text>
          {plans.length === 0 ? (
            <EmptyState
              title="Nenhuma ficha ainda"
              description={`Monte uma ficha para ${firstName} no botão Treinos acima.`}
            />
          ) : null}
          {available.map((plan) => (
            <View
              key={plan.id}
              className="flex-row items-center rounded-card border border-line bg-surface p-4"
            >
              <Pressable
                onPress={() =>
                  router.push(adminRoutes.workoutDetail(plan.id, student.userId) as Href)
                }
                className="min-w-0 flex-1 pr-3"
              >
                <Text className="font-semibold text-ink">{plan.title}</Text>
                <Text className="mt-0.5 text-sm text-muted">
                  {plan.exerciseCount} {plan.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleGrant(plan)}
                disabled={busyPlanId != null}
                accessibilityRole="button"
                accessibilityLabel={`Liberar ${plan.title} para ${student.name}`}
              >
                <Text className="text-sm font-semibold text-primary">
                  {busyPlanId === plan.id ? '...' : `Liberar para ${firstName}`}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}

function MetricChip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-primary/10 px-3 py-1">
      <Text className="text-xs font-semibold text-primary">{label}</Text>
    </View>
  );
}
