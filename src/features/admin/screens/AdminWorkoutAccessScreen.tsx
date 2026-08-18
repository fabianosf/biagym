import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import type { StudentProfile } from '@/domain/student';
import type { TrainingPlanGrant, TrainingPlanSummary } from '@/domain/workout';
import {
  DATA_FETCH_TIMEOUT_MS,
  getDataErrorMessage,
  getProfileById,
  grantTrainingPlanAccess,
  listTrainingPlanGrants,
  listTrainingPlans,
  revokeTrainingPlanAccess,
  withTimeout,
} from '@/services';
import { Button, EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type GrantWithName = TrainingPlanGrant & { studentName: string };

export function AdminWorkoutAccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [grants, setGrants] = useState<GrantWithName[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGranting, setIsGranting] = useState(false);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await withTimeout(
        listTrainingPlans(),
        DATA_FETCH_TIMEOUT_MS,
        'Os treinos demoraram demais para carregar. Tente novamente.',
      );
      setPlans(data);
      setSelectedPlanId((current) => current || data[0]?.id || '');
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const grantsRequestIdRef = useRef(0);

  const loadGrants = useCallback(async () => {
    const requestId = grantsRequestIdRef.current + 1;
    grantsRequestIdRef.current = requestId;

    if (!selectedPlanId) {
      setGrants([]);
      return;
    }

    try {
      const rows = await withTimeout(
        listTrainingPlanGrants(selectedPlanId),
        DATA_FETCH_TIMEOUT_MS,
        'As liberações demoraram demais para carregar. Tente novamente.',
      );
      const withNames = await Promise.all(
        rows.map(async (grant) => {
          try {
            const profile = await getProfileById(grant.userId);
            return { ...grant, studentName: profile?.name ?? grant.userId };
          } catch {
            return { ...grant, studentName: grant.userId };
          }
        }),
      );
      if (requestId !== grantsRequestIdRef.current) {
        return;
      }
      setGrants(withNames);
    } catch (err) {
      if (requestId !== grantsRequestIdRef.current) {
        return;
      }
      setError(getDataErrorMessage(err));
    }
  }, [selectedPlanId]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  async function handleGrant() {
    if (!user || !selectedStudent || !selectedPlanId) {
      setError('Selecione aluno e treino.');
      return;
    }

    setIsGranting(true);
    setError(null);
    setSuccess(null);
    try {
      await grantTrainingPlanAccess({
        userId: selectedStudent.userId,
        planId: selectedPlanId,
        grantedBy: user.id,
      });
      setSelectedStudent(null);
      setSuccess(`Treino liberado para ${selectedStudent.name}.`);
      await loadGrants();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsGranting(false);
    }
  }

  return (
    <AdminShell
      title="Liberar treinos"
      subtitle="Quem receber a liberação é o único aluno que vê esse treino."
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando liberações..." /> : null}

      {!isLoading && error && plans.length === 0 ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void loadPlans()} />
        </View>
      ) : null}

      {!isLoading && !error && plans.length === 0 ? (
        <View className="px-5 pt-4">
          <EmptyState
            title="Nenhum treino cadastrado"
            description="Crie um Treino A/B/C antes de liberar para os alunos."
          />
        </View>
      ) : null}

      {!isLoading && plans.length > 0 ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          {success ? <Text className="text-sm text-primary">{success}</Text> : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedPlanId(plan.id)}
                  className={`rounded-full px-3 py-2 ${
                    selectedPlanId === plan.id ? 'bg-primary' : 'bg-elevated'
                  }`}
                >
                  <Text className={selectedPlanId === plan.id ? 'font-semibold text-white' : 'text-ink'}>
                    {plan.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View className="rounded-card border border-line bg-surface p-5">
            <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
            <Button
              className="mt-4"
              label={
                selectedStudent
                  ? `Liberar só para ${selectedStudent.name}`
                  : 'Escolha o aluno para liberar'
              }
              loading={isGranting}
              disabled={!selectedStudent || isGranting}
              onPress={() => void handleGrant()}
            />
          </View>

          {grants.length === 0 ? (
            <Text className="text-sm text-muted">
              Nenhuma liberação neste treino. Nenhum aluno o vê até você liberar.
            </Text>
          ) : (
            grants.map((grant) => (
              <View key={grant.id} className="flex-row items-center rounded-card border border-line bg-surface p-4">
                <Text className="flex-1 font-medium text-ink">{grant.studentName}</Text>
                <Pressable
                  onPress={() =>
                    void revokeTrainingPlanAccess(grant.id)
                      .then(loadGrants)
                      .catch((err) => setError(getDataErrorMessage(err)))
                  }
                >
                  <Text className="text-sm text-red-400">Remover</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
