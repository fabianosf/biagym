import {
  AdminRecipientPicker,
  AdminShell,
} from '@/features/admin/components';
import { formatRecipientSummary } from '@/features/admin/utils/recipients';
import { useAuth } from '@/features/auth';
import type { StudentProfile } from '@/domain/student';
import type { Exercise, TrainingPlan, TrainingPlanGrant } from '@/domain/workout';
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
  notifyAccessGranted,
  parseOptionalLoadKg,
  publishTrainingPlanToStudents,
  updateTrainingPlan,
  updateWorkoutExercise,
  withTimeout,
} from '@/services';
import { Button, ErrorState, LoadingIndicator, TextField } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT } from '@/shared/theme';
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
  const t = useT();
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
    return selectedIds.map((id) => byId.get(id) ?? t('common.student'));
  }, [selectedIds, students, t]);

  const load = useCallback(async () => {
    if (!planId) {
      setPlan(null);
      setError(t('admin.workoutDetail.notFound'));
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const detail = await withTimeout(
        getTrainingPlan(planId),
        DATA_FETCH_TIMEOUT_MS,
        t('admin.workoutDetail.loadTimeout'),
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
        setError(t('admin.workoutDetail.notAvailable'));
      }
    } catch (err) {
      setPlan(null);
      setError(getDataErrorMessage(err));
    }

    try {
      const exercises = await withTimeout(
        listExercises(),
        DATA_FETCH_TIMEOUT_MS,
        t('admin.exercises.loadTimeoutShort'),
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
  }, [focusedStudentId, planId, t]);

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
      setError(t('admin.workoutDetail.registerExerciseFirst'));
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
      setError(t('admin.workoutDetail.chooseStudents'));
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
          : [t('admin.studentSpace.thisStudent')];
      setNotice(
        t('admin.workoutDetail.publishedFor', { names: formatRecipientSummary(names) }),
      );
      void notifyAccessGranted(targets, plan.title, 'workouts');
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
      setNotice(t('admin.workoutDetail.unpublishedNotice'));
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
    ? t('admin.workoutDetail.publishForName', {
        name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
      })
    : selectedIds.length === 0
      ? t('admin.workoutDetail.chooseStudentToPublish')
      : t('admin.workoutDetail.publishForName', { name: formatRecipientSummary(recipientNames) });

  const scopeLabel = focusedStudentId
    ? t('admin.workoutDetail.scopeIndividual', {
        name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
      })
    : t('admin.workoutDetail.scopeGeneric');

  return (
    <AdminShell
      title={plan?.title ?? t('workoutDetail.fallbackTitle')}
      subtitle={scopeLabel}
      showBack
      onBack={() =>
        focusedStudentId
          ? router.replace(adminRoutes.studentSpace(focusedStudentId) as Href)
          : router.back()
      }
    >
      {isLoading ? <LoadingIndicator fullScreen message={t('admin.workoutDetail.loading')} /> : null}

      {!isLoading && error && !plan ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading && plan ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

          {focusedStudentId && grants.length > 1 ? (
            <View className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
              <Text className="text-sm font-semibold text-amber-600">
                {t('admin.workoutDetail.sharedTitle')}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-amber-700">
                {t('admin.workoutDetail.sharedMessage', {
                  name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
                  countLabel: t(
                    grants.length - 1 === 1
                      ? 'admin.workoutDetail.sharedCountOne'
                      : 'admin.workoutDetail.sharedCountOther',
                    { count: String(grants.length - 1) },
                  ),
                })}
              </Text>
            </View>
          ) : null}

          <View className="rounded-card border border-line bg-surface p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
              {t('admin.workoutDetail.whoItGoesTo')}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              {focusedStudentId
                ? t('admin.workoutDetail.individualLabel', {
                    name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
                  })
                : selectedIds.length <= 1
                  ? t('admin.workoutDetail.individualLabel', {
                      name: formatRecipientSummary(recipientNames),
                    })
                  : t('admin.workoutDetail.collectiveLabel', {
                      names: formatRecipientSummary(recipientNames),
                    })}
            </Text>
            {grants.length > 0 && !focusedStudentId ? (
              <Text className="mt-1 text-xs text-faint">
                {t(
                  grants.length === 1
                    ? 'admin.workoutDetail.grantedTodayOne'
                    : 'admin.workoutDetail.grantedTodayOther',
                  { count: String(grants.length) },
                )}
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
                  {t('admin.workoutDetail.backToSpace', {
                    name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
                  })}
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
                  label={t('admin.workoutDetail.backToDraft')}
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
            <Text className="font-semibold text-primary">{t('admin.workoutDetail.openCatalog')}</Text>
          </Pressable>

          <View className="gap-3 rounded-card border border-line bg-surface p-5">
            <Text className="font-semibold text-ink">{t('admin.workoutDetail.addExercise')}</Text>
            {catalog.length === 0 ? (
              <Text className="text-sm text-muted">{t('admin.workoutDetail.registerFirst')}</Text>
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
                  label={t('admin.workoutDetail.setsLabel')}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  icon="grid-outline"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label={t('admin.workoutDetail.repsLabel')}
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
                  label={t('exercise.loadKg')}
                  value={loadKg}
                  onChangeText={setLoadKg}
                  placeholder={t('admin.workoutDetail.loadPlaceholder')}
                  keyboardType="decimal-pad"
                  icon="barbell-outline"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label={t('admin.workoutDetail.restLabel')}
                  value={rest}
                  onChangeText={setRest}
                  keyboardType="number-pad"
                  icon="timer-outline"
                />
              </View>
            </View>
            <Button
              label={t('admin.workoutDetail.includeInWorkout')}
              loading={isSaving}
              disabled={catalog.length === 0}
              onPress={() => void handleAdd()}
            />
          </View>

          {(plan.exercises ?? []).map((item, index) => {
            const draft = drafts[item.id] ?? EMPTY_DRAFT;
            const muscleLabel = t(`muscleGroups.${item.exercise?.muscleGroup ?? 'corpo_todo'}`);
            return (
              <View key={item.id} className="rounded-card border border-line bg-surface p-4">
                <Text className="font-semibold text-ink">
                  {index + 1}. {item.exercise?.name ?? t('exercise.fallbackTitle')}
                </Text>
                <Text className="mt-1 text-xs text-muted">{muscleLabel}</Text>
                <View className="mt-3 gap-3">
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextField
                        label={t('admin.workoutDetail.setsLabel')}
                        value={draft.sets}
                        onChangeText={(value) => updateDraft(item.id, { sets: value })}
                        keyboardType="number-pad"
                        icon="grid-outline"
                      />
                    </View>
                    <View className="flex-1">
                      <TextField
                        label={t('admin.workoutDetail.repsLabel')}
                        value={draft.reps}
                        onChangeText={(value) => updateDraft(item.id, { reps: value })}
                        icon="repeat-outline"
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <TextField
                        label={t('exercise.loadKg')}
                        value={draft.loadKg}
                        onChangeText={(value) => updateDraft(item.id, { loadKg: value })}
                        keyboardType="decimal-pad"
                        icon="barbell-outline"
                      />
                    </View>
                    <View className="flex-1">
                      <TextField
                        label={t('admin.workoutDetail.restLabel')}
                        value={draft.rest}
                        onChangeText={(value) => updateDraft(item.id, { rest: value })}
                        keyboardType="number-pad"
                        icon="timer-outline"
                      />
                    </View>
                  </View>
                  <Button
                    label={t('admin.workoutDetail.savePrescription')}
                    loading={savingItemId === item.id}
                    onPress={() => void handleSaveItem(item.id)}
                  />
                </View>
                <View className="mt-3 flex-row gap-4">
                  <Pressable onPress={() => void moveItem(item.id, -1)}>
                    <Text className="text-sm text-primary">{t('admin.workoutDetail.moveUp')}</Text>
                  </Pressable>
                  <Pressable onPress={() => void moveItem(item.id, 1)}>
                    <Text className="text-sm text-primary">{t('admin.workoutDetail.moveDown')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      void deleteWorkoutExercise(item.id)
                        .then(() => load())
                        .catch((err) => setError(getDataErrorMessage(err)))
                    }
                  >
                    <Text className="text-sm text-red-500">{t('common.remove')}</Text>
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
