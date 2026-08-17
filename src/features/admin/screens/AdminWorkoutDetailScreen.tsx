import { AdminShell } from '@/features/admin/components';
import type { Exercise, TrainingPlan } from '@/domain/workout';
import {
  addWorkoutExercise,
  deleteWorkoutExercise,
  getDataErrorMessage,
  getTrainingPlan,
  listExercises,
  parseOptionalLoadKg,
  updateTrainingPlan,
  updateWorkoutExercise,
} from '@/services';
import { Button, TextField } from '@/shared/components';
import { MUSCLE_GROUP_LABELS } from '@/domain/workout';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type PrescriptionDraft = {
  sets: string;
  reps: string;
  loadKg: string;
  rest: string;
};

export function AdminWorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const planId = typeof id === 'string' ? id : undefined;
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [loadKg, setLoadKg] = useState('');
  const [rest, setRest] = useState('60');
  const [drafts, setDrafts] = useState<Record<string, PrescriptionDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!planId) {
      return;
    }

    try {
      const [detail, exercises] = await Promise.all([getTrainingPlan(planId), listExercises()]);
      setPlan(detail);
      setCatalog(exercises);
      setDrafts(
        Object.fromEntries(
          (detail?.exercises ?? []).map((item) => [
            item.id,
            {
              sets: String(item.sets),
              reps: item.reps,
              loadKg: item.loadKg != null ? String(item.loadKg) : '',
              rest: String(item.restSeconds),
            },
          ]),
        ),
      );
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }, [planId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedExerciseId && catalog[0]) {
      setSelectedExerciseId(catalog[0].id);
    }
  }, [catalog, selectedExerciseId]);

  async function handleAdd() {
    if (!planId || !selectedExerciseId) {
      setError('Cadastre um exercício no catálogo antes de montar o treino.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await addWorkoutExercise({
        planId,
        exerciseId: selectedExerciseId,
        sets: Number.parseInt(sets, 10) || 3,
        reps,
        loadKg: parseOptionalLoadKg(loadKg),
        restSeconds: Number.parseInt(rest, 10) || 60,
      });
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveItem(itemId: string) {
    const draft = drafts[itemId];
    const current = plan?.exercises.find((item) => item.id === itemId);
    if (!draft || !current) {
      return;
    }

    setSavingItemId(itemId);
    setError(null);
    try {
      await updateWorkoutExercise(itemId, {
        sets: Number.parseInt(draft.sets, 10) || current.sets,
        reps: draft.reps,
        loadKg: parseOptionalLoadKg(draft.loadKg),
        restSeconds: Number.parseInt(draft.rest, 10) || current.restSeconds,
        notes: current.notes,
        sortOrder: current.sortOrder,
      });
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setSavingItemId(null);
    }
  }

  async function handlePublish(nextPublished: boolean) {
    if (!plan) {
      return;
    }

    setError(null);
    try {
      await updateTrainingPlan(plan.id, {
        title: plan.title,
        description: plan.description,
        isPublished: nextPublished,
        sortOrder: plan.sortOrder,
      });
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  async function moveItem(itemId: string, direction: -1 | 1) {
    if (!plan) {
      return;
    }

    const ordered = [...plan.exercises];
    const index = ordered.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) {
      return;
    }

    const current = ordered[index];
    const swap = ordered[target];
    if (!current || !swap) {
      return;
    }
    await updateWorkoutExercise(current.id, {
      sets: current.sets,
      reps: current.reps,
      loadKg: current.loadKg,
      restSeconds: current.restSeconds,
      notes: current.notes,
      sortOrder: swap.sortOrder,
    });
    await updateWorkoutExercise(swap.id, {
      sets: swap.sets,
      reps: swap.reps,
      loadKg: swap.loadKg,
      restSeconds: swap.restSeconds,
      notes: swap.notes,
      sortOrder: current.sortOrder,
    });
    await load();
  }

  function updateDraft(itemId: string, patch: Partial<PrescriptionDraft>) {
    setDrafts((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...patch } as PrescriptionDraft,
    }));
  }

  return (
    <AdminShell
      title={plan?.title ?? 'Treino'}
      subtitle="Adicione séries, reps, carga e descanso em cada exercício."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

        {plan ? (
          <View className="rounded-card border border-line bg-surface p-5">
            <Text className="text-sm text-muted">
              {plan.isPublished
                ? 'Publicado. Sem liberações, todos os alunos veem. Com liberações, só os escolhidos.'
                : 'Ainda é rascunho. O aluno só vê depois de publicar (ou ao liberar para alguém).'}
            </Text>
            <View className="mt-3 gap-3">
              <Button
                label={plan.isPublished ? 'Despublicar' : 'Publicar treino'}
                onPress={() => void handlePublish(!plan.isPublished)}
              />
              <Button
                variant="secondary"
                label="Liberar para aluno"
                onPress={() => router.push(adminRoutes.workoutAccess as Href)}
              />
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push(adminRoutes.exercises as Href)}
          className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
        >
          <Text className="font-semibold text-primary">Abrir catálogo de exercícios / upload</Text>
        </Pressable>

        <View className="gap-3 rounded-card border border-line bg-surface p-5">
          <Text className="font-semibold text-ink">Adicionar exercício</Text>
          {catalog.length === 0 ? (
            <Text className="text-sm text-muted">
              Cadastre pelo menos um exercício no catálogo para montar esta ficha.
            </Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {catalog.map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => setSelectedExerciseId(exercise.id)}
                className={`rounded-full px-3 py-2 ${
                  selectedExerciseId === exercise.id ? 'bg-primary' : 'bg-elevated'
                }`}
              >
                <Text
                  className={selectedExerciseId === exercise.id ? 'font-semibold text-white' : 'text-ink'}
                >
                  {exercise.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField label="Séries" value={sets} onChangeText={setSets} keyboardType="number-pad" icon="grid-outline" />
            </View>
            <View className="flex-1">
              <TextField label="Reps" value={reps} onChangeText={setReps} placeholder="8-12" icon="repeat-outline" />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="Carga (kg)"
                value={loadKg}
                onChangeText={setLoadKg}
                placeholder="vazio = peso corporal"
                keyboardType="decimal-pad"
                icon="barbell-outline"
              />
            </View>
            <View className="flex-1">
              <TextField
                label="Descanso (s)"
                value={rest}
                onChangeText={setRest}
                keyboardType="number-pad"
                icon="timer-outline"
              />
            </View>
          </View>
          <Button
            label="Incluir no treino"
            loading={isSaving}
            disabled={catalog.length === 0}
            onPress={() => void handleAdd()}
          />
        </View>

        {plan?.exercises.map((item, index) => {
          const draft = drafts[item.id];
          return (
            <View key={item.id} className="rounded-card border border-line bg-surface p-4">
              <Text className="font-semibold text-ink">
                {index + 1}. {item.exercise.name}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {MUSCLE_GROUP_LABELS[item.exercise.muscleGroup]}
              </Text>
              {draft ? (
                <View className="mt-3 gap-3">
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextField
                        label="Séries"
                        value={draft.sets}
                        onChangeText={(value) => updateDraft(item.id, { sets: value })}
                        keyboardType="number-pad"
                        icon="grid-outline"
                      />
                    </View>
                    <View className="flex-1">
                      <TextField
                        label="Reps"
                        value={draft.reps}
                        onChangeText={(value) => updateDraft(item.id, { reps: value })}
                        icon="repeat-outline"
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextField
                        label="Carga (kg)"
                        value={draft.loadKg}
                        onChangeText={(value) => updateDraft(item.id, { loadKg: value })}
                        keyboardType="decimal-pad"
                        icon="barbell-outline"
                      />
                    </View>
                    <View className="flex-1">
                      <TextField
                        label="Descanso (s)"
                        value={draft.rest}
                        onChangeText={(value) => updateDraft(item.id, { rest: value })}
                        keyboardType="number-pad"
                        icon="timer-outline"
                      />
                    </View>
                  </View>
                  <Button
                    label="Salvar prescrição"
                    loading={savingItemId === item.id}
                    onPress={() => void handleSaveItem(item.id)}
                  />
                </View>
              ) : null}
              <View className="mt-3 flex-row gap-4">
                <Pressable onPress={() => void moveItem(item.id, -1)}>
                  <Text className="text-sm text-primary">Subir</Text>
                </Pressable>
                <Pressable onPress={() => void moveItem(item.id, 1)}>
                  <Text className="text-sm text-primary">Descer</Text>
                </Pressable>
                <Pressable onPress={() => void deleteWorkoutExercise(item.id).then(load)}>
                  <Text className="text-sm text-red-400">Remover</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </AdminShell>
  );
}
