import { AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import type { TrainingPlanSummary } from '@/domain/workout';
import {
  bootstrapSampleGymCatalog,
  createTrainingPlan,
  deleteTrainingPlan,
  getDataErrorMessage,
  listTrainingPlans,
  slugifyPlanTitle,
} from '@/services';
import { Button, TextField } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const QUICK_TITLES = ['Treino A', 'Treino B', 'Treino C'];

export function AdminWorkoutsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { focusedStudentId, student: focusedStudent, goBackToStudent } = useAdminFocusedStudent();
  const firstName = focusedStudent ? getStudentFirstName(focusedStudent.name) : null;
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [title, setTitle] = useState('Treino A');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPlans(await listTrainingPlans());
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openPlan(planId: string) {
    try {
      router.push(adminRoutes.workoutDetail(planId, focusedStudentId || undefined) as Href);
    } catch {
      setError('Não foi possível abrir este treino. Tente de novo.');
    }
  }

  async function handleCreate() {
    if (!user) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const plan = await createTrainingPlan({
        title,
        slug: slugifyPlanTitle(title),
        description: description || undefined,
        createdBy: user.id,
        sortOrder: plans.length,
      });
      setDescription('');
      await load();
      openPlan(plan.id);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBootstrapSamples() {
    if (!user) {
      return;
    }

    setIsBootstrapping(true);
    setError(null);
    setNotice(null);
    try {
      const result = await bootstrapSampleGymCatalog(user.id);
      await load();
      setNotice(
        `Treino A e Treino B prontos (${result.exerciseCount} exercícios).${
          firstName
            ? ` Volte e libere para ${firstName}.`
            : ' Entre no aluno e publique com o nome visível no botão.'
        }`,
      );
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleDelete(plan: TrainingPlanSummary) {
    setBusyPlanId(plan.id);
    setError(null);
    try {
      await deleteTrainingPlan(plan.id);
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  }

  return (
    <AdminShell
      title={firstName ? `Fichas para ${firstName}` : 'Catálogo de treinos'}
      subtitle={
        focusedStudent
          ? `O que você publicar nesta tela vai para ${focusedStudent.name}.`
          : 'Aqui você monta a ficha. Para o aluno receber, entre no espaço dele.'
      }
      showBack
      onBack={goBackToStudent}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

        <View className="gap-3 rounded-card border border-primary/30 bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">Exemplos A / B</Text>
          <Text className="text-sm leading-5 text-muted">
            Sobe os MP4 da pasta videos/, cria os exercícios e monta Treino A e Treino B com
            séries, reps, carga e descanso.
          </Text>
          <Button
            label="Cadastrar Treino A e B com vídeos de exemplo"
            loading={isBootstrapping}
            onPress={() => void handleBootstrapSamples()}
          />
        </View>

        <View className="gap-3 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">Nova ficha</Text>
          <View className="flex-row flex-wrap gap-2">
            {QUICK_TITLES.map((quick) => (
              <Pressable
                key={quick}
                onPress={() => setTitle(quick)}
                className={`rounded-full px-3 py-2 ${title === quick ? 'bg-primary' : 'bg-elevated'}`}
              >
                <Text className={title === quick ? 'font-semibold text-white' : 'text-ink'}>
                  {quick}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextField
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Treino A"
            icon="barbell-outline"
          />
          <TextField
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Membros inferiores · 45 min"
            icon="document-text-outline"
          />
          <Button
            label={firstName ? `Criar ficha para ${firstName}` : 'Criar ficha'}
            loading={isSaving}
            onPress={() => void handleCreate()}
          />
          <Text className="text-xs leading-5 text-faint">
            {firstName
              ? `Depois de montar, publique para ${firstName}. Só essa pessoa vê.`
              : 'Criar a ficha não envia para ninguém. Publique no espaço do aluno.'}
          </Text>
        </View>

        {isLoading ? <Text className="text-sm text-muted">Carregando treinos...</Text> : null}

        {!isLoading && plans.length === 0 ? (
          <Text className="text-sm text-muted">
            Nenhuma ficha cadastrada ainda. Crie o Treino A, B ou C acima.
          </Text>
        ) : null}

        {plans.map((plan) => (
          <View key={plan.id} className="rounded-card border border-line bg-surface p-5">
            <Pressable
              onPress={() => openPlan(plan.id)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ficha ${plan.title}`}
            >
              <Text className="text-lg font-semibold text-ink">{plan.title || 'Treino'}</Text>
              <Text className="mt-1 text-xs text-muted">
                {plan.exerciseCount} exercícios ·{' '}
                {plan.isPublished
                  ? 'No catálogo — só quem você escolheu vê'
                  : 'Rascunho — ainda não foi para nenhum aluno'}
              </Text>
            </Pressable>
            <View className="mt-3 flex-row gap-4">
              <Pressable onPress={() => openPlan(plan.id)}>
                <Text className="text-sm font-semibold text-primary">Abrir ficha</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleDelete(plan)}
                disabled={busyPlanId === plan.id}
              >
                <Text className="text-sm text-red-400">
                  {busyPlanId === plan.id ? '...' : 'Remover'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </AdminShell>
  );
}
