import { AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import type { TrainingPlanSummary } from '@/domain/workout';
import {
  createTrainingPlan,
  deleteTrainingPlan,
  getDataErrorMessage,
  listTrainingPlans,
  slugifyPlanTitle,
  updateTrainingPlan,
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
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [title, setTitle] = useState('Treino A');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlans(await listTrainingPlans());
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!user) {
      return;
    }

    setIsSaving(true);
    setError(null);
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
      router.push(adminRoutes.workoutDetail(plan.id) as Href);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell
      title="Treinos A / B / C"
      subtitle="Monte a ficha. O aluno executa no app, exercício por exercício."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

        <View className="gap-3 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">Novo treino</Text>
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
          <Button label="Criar treino" loading={isSaving} onPress={() => void handleCreate()} />
          <Text className="text-xs leading-5 text-faint">
            Depois de criar, inclua os exercícios e publique. Sem publicação o aluno não vê o
            treino.
          </Text>
        </View>

        {plans.map((plan) => (
          <View key={plan.id} className="rounded-card border border-line bg-surface p-5">
            <Pressable onPress={() => router.push(adminRoutes.workoutDetail(plan.id) as Href)}>
              <Text className="text-lg font-semibold text-ink">{plan.title}</Text>
              <Text className="mt-1 text-xs text-muted">
                {plan.exerciseCount} exercícios · {plan.isPublished ? 'Publicado' : 'Rascunho'}
              </Text>
            </Pressable>
            <View className="mt-3 flex-row gap-4">
              <Pressable
                onPress={() =>
                  void updateTrainingPlan(plan.id, {
                    title: plan.title,
                    description: plan.description,
                    isPublished: !plan.isPublished,
                    sortOrder: plan.sortOrder,
                  }).then(load)
                }
              >
                <Text className="text-sm font-semibold text-primary">
                  {plan.isPublished ? 'Despublicar' : 'Publicar'}
                </Text>
              </Pressable>
              <Pressable onPress={() => void deleteTrainingPlan(plan.id).then(load)}>
                <Text className="text-sm text-red-400">Remover</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </AdminShell>
  );
}
