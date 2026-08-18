import {
  AdminRecipientPicker,
  AdminShell,
} from '@/features/admin/components';
import { formatRecipientSummary } from '@/features/admin/utils/recipients';
import { useAuth } from '@/features/auth';
import type { StudentProfile } from '@/domain/student';
import type { Exercise, TrainingPlan, TrainingPlanGrant } from '@/domain/workout';
import { MUSCLE_GROUP_LABELS } from '@/domain/workout';
import {
  DATA_FETCH_TIMEOUT_MS,
  addWorkoutExercise,
  deleteWorkoutExercise,
  getDataErrorMessage,
  getStudentProfileById,
  getTrainingPlan,
  listExercises,
  listStudentProfiles,
  listTrainingPlanGrants,
  parseOptionalLoadKg,
  publishTrainingPlanToStudents,
  updateTrainingPlan,
  updateWorkoutExercise,
  withTimeout,
} from '@/services';
import { Button, ErrorState, LoadingIndicator, TextField } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { resolveRouteParam } from '@/shared/utils';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type PrescriptionDraft = {
  sets: string;
  reps: string;
  loadKg: string;
  rest: string;
};

const EMPTY_DRAFT: PrescriptionDraft = {
  sets: '3', // Valor padrão para séries
  reps: '12', // Valor padrão para repetições
  loadKg: '',
  rest: '60', // Valor padrão para descanso
};

export function AdminWorkoutDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[]; studentId?: string | string[] }>();
  const planId = resolveRouteParam(params.id);
  const focusedStudentId = resolveRouteParam(params.studentId);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [grants, setGrants] = useState<TrainingPlanGrant[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [sets, setSets] = useState(EMPTY_DRAFT.sets);
  const [reps, setReps] = useState(EMPTY_DRAFT.reps);
  const [loadKg, setLoadKg] = useState(EMPTY_DRAFT.loadKg);
  const [rest, setRest] = useState(EMPTY_DRAFT.rest);
  const [drafts, setDrafts] = useState<Record<string, PrescriptionDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const focusedStudent = useMemo(
    () => students.find((student) => student.userId === focusedStudentId) ?? null,
    [focusedStudentId, students],
  );

  const recipientNames = useMemo(() => {
    const byId = new Map(students.map((student) => [student.userId, student.name]));
    return selectedIds.map((id) => byId.get(id) ?? 'Aluno');
  }, [selectedIds, students]);

  const load = useCallback(async () => {
    if (!planId) {
      setPlan(null);
      setError('Não encontramos este treino. Volte e abra de novo.');
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const detail = await withTimeout(
        getTrainingPlan(planId),
        DATA_FETCH_TIMEOUT_MS,
        'O treino demorou demais para carregar. Tente novamente.',
      );
      setPlan(detail);
      setDrafts(
        Object.fromEntries(
          (detail?.exercises ?? []).map((item) => [
            item.id,
            {
              sets: String(item.sets ?? EMPTY_DRAFT.sets),
              reps: item.reps || EMPTY_DRAFT.reps,
              loadKg: item.loadKg != null ? String(item.loadKg) : '',
              rest: String(item.restSeconds ?? EMPTY_DRAFT.rest),
            },
          ]),
        ),
      );
      if (!detail) {
        setError('Este treino não está mais disponível.');
      }
    } catch (err) {
      setPlan(null);
      setError(getDataErrorMessage(err));
    }

    try {
      const exercises = await withTimeout(
        listExercises(),
        DATA_FETCH_TIMEOUT_MS,
        'Os exercícios demoraram demais para carregar.',
      );
      setCatalog(exercises);
    } catch {
      setCatalog([]);
    }

    try {
      const [profileList, planGrants] = await Promise.all([
        withTimeout(listStudentProfiles(), DATA_FETCH_TIMEOUT_MS),
        withTimeout(listTrainingPlanGrants(planId), DATA_FETCH_TIMEOUT_MS),
      ]);
      setStudents(profileList);
      setGrants(planGrants);
      const grantedIds = planGrants.map((grant) => grant.userId);
      setSelectedIds((current) => {
        if (focusedStudentId) {
          return [focusedStudentId];
        }
        if (current.length > 0) {
          return current;
        }
        return grantedIds;
      });
    } catch {
      setStudents([]);
      setGrants([]);
      if (focusedStudentId) {
        setSelectedIds([focusedStudentId]);
      }
    }

    if (focusedStudentId) {
      try {
        const profile = await getStudentProfileById(focusedStudentId);
        if (profile) {
          setStudents((current) =>
            current.some((item) => item.userId === profile.userId)
              ? current
              : [profile, ...current],
          );
        }
      } catch {
        // ambiente individual ainda abre o treino
      }
    }

    setIsLoading(false);
  }, [focusedStudentId, planId]);

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
        sets: Number.parseInt(sets, 10) || Number(EMPTY_DRAFT.sets),
        reps,
        loadKg: parseOptionalLoadKg(loadKg),
        restSeconds: Number.parseInt(rest, 10) || Number(EMPTY_DRAFT.rest),
      });
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveItem(itemId: string) {
    const draft = drafts[itemId] ?? EMPTY_DRAFT;
    const current = plan?.exercises.find((item) => item.id === itemId);
    if (!current) {
      return;
    }

    setSavingItemId(itemId);
    setError(null);
    try {
      await updateWorkoutExercise(itemId, {
        sets: Number.parseInt(draft.sets, 10) || current.sets,
        reps: draft.reps || current.reps,
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

  async function handlePublish() {
    if (!user || !plan) {
      return;
    }

    const targets = focusedStudentId ? [focusedStudentId] : selectedIds;
    if (targets.length === 0) {
      setError('Escolha o aluno (ou os alunos) que vão receber este treino.');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setNotice(null);
    try {
      await publishTrainingPlanToStudents({
        planId: plan.id,
        studentIds: targets,
        grantedBy: user.id,
      });
      const names = focusedStudent?.name
        ? [focusedStudent.name]
        : recipientNames.length > 0
          ? recipientNames
          : ['este aluno'];
      setNotice(`Publicado para ${formatRecipientSummary(names)}. Só quem foi escolhido vê.`);
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (!plan) {
      return;
    }

    setIsPublishing(true);
    setError(null);
    setNotice(null);
    try {
      await updateTrainingPlan(plan.id, {
        title: plan.title,
        description: plan.description,
        isPublished: false,
        sortOrder: plan.sortOrder,
      });
      setNotice('Treino voltou a rascunho. Nenhum aluno vê até você publicar de novo.');
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsPublishing(false);
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

    try {
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
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  function updateDraft(itemId: string, patch: Partial<PrescriptionDraft>) {
    setDrafts((current) => ({
      ...current,
      [itemId]: { ...(current[itemId] ?? EMPTY_DRAFT), ...patch },
    }));
  }

  function toggleRecipient(studentId: string) {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  const publishLabel = focusedStudentId
    ? `Publicar para ${focusedStudent?.name ?? 'este aluno'}`
    : selectedIds.length === 0
      ? 'Escolha o aluno para publicar'
      : `Publicar para ${formatRecipientSummary(recipientNames)}`;

  const scopeLabel = focusedStudentId
    ? `Ambiente de ${focusedStudent?.name ?? 'este aluno'}. Este treino fica só com este aluno.`
    : 'Escolha o aluno (ou os alunos). Sem nome marcado, ninguém vê.';

  return (
    <AdminShell
      title={plan?.title ?? 'Treino'}
      subtitle={scopeLabel}
      showBack
      onBack={() =>
        focusedStudentId
          ? router.replace(adminRoutes.studentSpace(focusedStudentId) as Href)
          : router.back()
      }
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando treino..." /> : null}

      {!isLoading && error && !plan ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading && plan ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

          <View className="rounded-card border border-line bg-surface p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
              Para quem vai
            </Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              {focusedStudentId
                ? `Individual: ${focusedStudent?.name ?? 'este aluno'}`
                : selectedIds.length <= 1
                  ? `Individual: ${formatRecipientSummary(recipientNames)}`
                  : `Coletivo: ${formatRecipientSummary(recipientNames)}`}
            </Text>
            {grants.length > 0 && !focusedStudentId ? (
              <Text className="mt-1 text-xs text-faint">
                Já liberado hoje para {grants.length} {grants.length === 1 ? 'aluno' : 'alunos'}.
              </Text>
            ) : null}

            {!focusedStudentId ? (
              <View className="mt-4">
                <AdminRecipientPicker
                  students={students}
                  selectedIds={selectedIds}
                  onToggle={toggleRecipient}
                />
              </View>
            ) : null}

            {focusedStudentId ? (
              <Pressable
                onPress={() => router.push(adminRoutes.studentSpace(focusedStudentId) as Href)}
                className="mt-3"
              >
                <Text className="text-sm font-semibold text-primary">
                  Voltar ao espaço de {focusedStudent?.name ?? 'este aluno'}
                </Text>
              </Pressable>
            ) : null}

            <View className="mt-4 gap-3">
              <Button
                label={publishLabel}
                loading={isPublishing}
                disabled={isPublishing || (focusedStudentId ? false : selectedIds.length === 0)}
                onPress={() => void handlePublish()}
              />
              {plan.isPublished ? (
                <Button
                  variant="secondary"
                  label="Voltar para rascunho"
                  disabled={isPublishing}
                  onPress={() => void handleUnpublish()}
                />
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={() =>
              router.push(
                (focusedStudentId
                  ? adminRoutes.exercisesFor(focusedStudentId)
                  : adminRoutes.exercises) as Href,
              )
            }
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
                    className={
                      selectedExerciseId === exercise.id ? 'font-semibold text-white' : 'text-ink'
                    }
                  >
                    {exercise.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Séries"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  icon="grid-outline"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Reps"
                  value={reps}
                  onChangeText={setReps}
                  placeholder="8-12"
                  icon="repeat-outline"
                />
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

          {(plan.exercises ?? []).map((item, index) => {
            const draft = drafts[item.id] ?? EMPTY_DRAFT;
            const muscleLabel =
              MUSCLE_GROUP_LABELS[item.exercise?.muscleGroup ?? 'corpo_todo'] ??
              MUSCLE_GROUP_LABELS.corpo_todo;
            return (
              <View key={item.id} className="rounded-card border border-line bg-surface p-4">
                <Text className="font-semibold text-ink">
                  {index + 1}. {item.exercise?.name ?? 'Exercício'}
                </Text>
                <Text className="mt-1 text-xs text-muted">{muscleLabel}</Text>
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
                <View className="mt-3 flex-row gap-4">
                  <Pressable onPress={() => void moveItem(item.id, -1)}>
                    <Text className="text-sm text-primary">Subir</Text>
                  </Pressable>
                  <Pressable onPress={() => void moveItem(item.id, 1)}>
                    <Text className="text-sm text-primary">Descer</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      void deleteWorkoutExercise(item.id)
                        .then(() => load())
                        .catch((err) => setError(getDataErrorMessage(err)))
                    }
                  >
                    <Text className="text-sm text-red-500">Remover</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
