import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import type { StudentProfile } from '@/domain/student';
import type { TrainingPlanGrant, TrainingPlanSummary } from '@/domain/workout';
import {
  getDataErrorMessage,
  getProfileById,
  grantTrainingPlanAccess,
  listTrainingPlanGrants,
  listTrainingPlans,
  revokeTrainingPlanAccess,
} from '@/services';
import { Button } from '@/shared/components';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

  const loadPlans = useCallback(async () => {
    const data = await listTrainingPlans();
    setPlans(data);
    if (data[0] && !selectedPlanId) {
      setSelectedPlanId(data[0].id);
    }
  }, [selectedPlanId]);

  const loadGrants = useCallback(async () => {
    if (!selectedPlanId) {
      setGrants([]);
      return;
    }

    const rows = await listTrainingPlanGrants(selectedPlanId);
    const withNames = await Promise.all(
      rows.map(async (grant) => {
        const profile = await getProfileById(grant.userId);
        return { ...grant, studentName: profile?.name ?? grant.userId };
      }),
    );
    setGrants(withNames);
  }, [selectedPlanId]);

  useEffect(() => {
    void loadPlans().catch((err) => setError(getDataErrorMessage(err)));
  }, [loadPlans]);

  useEffect(() => {
    void loadGrants().catch((err) => setError(getDataErrorMessage(err)));
  }, [loadGrants]);

  async function handleGrant() {
    if (!user || !selectedStudent || !selectedPlanId) {
      setError('Selecione aluno e treino.');
      return;
    }

    try {
      await grantTrainingPlanAccess({
        userId: selectedStudent.userId,
        planId: selectedPlanId,
        grantedBy: user.id,
      });
      setSelectedStudent(null);
      await loadGrants();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  return (
    <AdminShell
      title="Liberar treinos"
      subtitle="Liberar um aluno publica o treino automaticamente. Sem nenhuma liberação, todos veem o treino publicado."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
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
          <Button className="mt-4" label="Liberar este treino" onPress={() => void handleGrant()} />
        </View>

        {grants.map((grant) => (
          <View key={grant.id} className="flex-row items-center rounded-card border border-line bg-surface p-4">
            <Text className="flex-1 font-medium text-ink">{grant.studentName}</Text>
            <Pressable onPress={() => void revokeTrainingPlanAccess(grant.id).then(loadGrants)}>
              <Text className="text-sm text-red-400">Remover</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </AdminShell>
  );
}
