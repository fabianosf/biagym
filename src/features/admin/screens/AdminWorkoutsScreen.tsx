import { AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import type { TrainingPlanSummary } from '@/domain/workout';
import {
  bootstrapSampleGymCatalog,
  createTrainingPlan,
  DATA_FETCH_TIMEOUT_MS,
  deleteTrainingPlan,
  getDataErrorMessage,
  listTrainingPlans,
  slugifyPlanTitle,
  updateTrainingPlan,
  withTimeout,
} from '@/services';
import { Button, EmptyState, FeedbackBanner, LoadingIndicator, TextField } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT } from '@/shared/theme';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

function successHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}

const QUICK_TITLES = ['Treino A', 'Treino B', 'Treino C'];

export function AdminWorkoutsScreen() {
  const router = useRouter();
  const t = useT();
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
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState('');
  const [editDescriptionDraft, setEditDescriptionDraft] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      setPlans(
        await withTimeout(
          listTrainingPlans(),
          DATA_FETCH_TIMEOUT_MS,
          t('admin.workoutsScreen.loadTimeout'),
        ),
      );
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current);
      hasLoadedRef.current = true;
    }, [load]),
  );

  function openPlan(planId: string) {
    try {
      router.push(adminRoutes.workoutDetail(planId, focusedStudentId || undefined) as Href);
    } catch {
      setError(t('workouts.openFailed'));
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
      const plan = await withTimeout(
        createTrainingPlan({
          title,
          slug: slugifyPlanTitle(title),
          description: description || undefined,
          createdBy: user.id,
          sortOrder: plans.length,
        }),
        DATA_FETCH_TIMEOUT_MS,
        t('admin.workoutsScreen.createTimeout'),
      );
      setDescription('');
      successHaptic();
      await load(true);
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
      const result = await withTimeout(
        bootstrapSampleGymCatalog(user.id),
        8 * 60_000,
        t('admin.workoutsScreen.bootstrapTimeout'),
      );
      successHaptic();
      await load(true);
      setNotice(
        t('admin.workoutsScreen.bootstrapDone', { count: String(result.exerciseCount) }) +
          ' ' +
          (firstName
            ? t('admin.workoutsScreen.bootstrapDoneFor', { name: firstName })
            : t('admin.workoutsScreen.bootstrapDoneGeneric')),
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
      await withTimeout(
        deleteTrainingPlan(plan.id),
        DATA_FETCH_TIMEOUT_MS,
        t('admin.workoutsScreen.deleteTimeout'),
      );
      successHaptic();
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  }

  function confirmDelete(plan: TrainingPlanSummary) {
    Alert.alert(
      t('admin.workoutsScreen.deletePlanTitle'),
      t('admin.workoutsScreen.deletePlanMessage', {
        title: plan.title || t('workoutDetail.fallbackTitle'),
        accessNote: plan.isPublished ? t('admin.workoutsScreen.deletePlanAccessNote') : '',
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => void handleDelete(plan) },
      ],
    );
  }

  function startEdit(plan: TrainingPlanSummary) {
    setEditingPlanId(plan.id);
    setEditTitleDraft(plan.title ?? '');
    setEditDescriptionDraft(plan.description ?? '');
  }

  function cancelEdit() {
    setEditingPlanId(null);
    setEditTitleDraft('');
    setEditDescriptionDraft('');
  }

  async function handleSaveEdit(plan: TrainingPlanSummary) {
    if (!editTitleDraft.trim()) {
      setError(t('admin.workoutsScreen.titleRequired'));
      return;
    }

    setIsSavingEdit(true);
    setError(null);
    try {
      await withTimeout(
        updateTrainingPlan(plan.id, {
          title: editTitleDraft.trim(),
          description: editDescriptionDraft.trim() || undefined,
        }),
        DATA_FETCH_TIMEOUT_MS,
        t('admin.programFormScreen.saveFailed'),
      );
      successHaptic();
      cancelEdit();
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <AdminShell
      title={firstName ? t('admin.workoutsScreen.titleFor', { name: firstName }) : t('admin.workoutsScreen.title')}
      subtitle={
        focusedStudent
          ? t('admin.workoutsScreen.subtitleFor', { name: focusedStudent.name })
          : t('admin.workoutsScreen.subtitleGeneric')
      }
      showBack={router.canGoBack()}
      onBack={goBackToStudent}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-28">
        {error ? <FeedbackBanner message={error} variant="warning" /> : null}
        {notice ? <FeedbackBanner message={notice} variant="success" /> : null}

        <View className="gap-3 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">{t('admin.workoutsScreen.newPlan')}</Text>
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
            label={t('admin.programForm.title')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('admin.workoutsScreen.titlePlaceholder')}
            icon="barbell-outline"
          />
          <TextField
            label={t('admin.schedule.notesLabel')}
            value={description}
            onChangeText={setDescription}
            placeholder="Membros inferiores · 45 min"
            icon="document-text-outline"
          />
          <Button
            label={firstName ? t('admin.workoutsScreen.createPlanFor', { name: firstName }) : t('admin.workoutsScreen.createPlan')}
            loading={isSaving}
            onPress={() => void handleCreate()}
          />
          <Text className="text-xs leading-5 text-faint">
            {firstName
              ? t('admin.workoutsScreen.createHintFor', { name: firstName })
              : t('admin.workoutsScreen.createHintGeneric')}
          </Text>
        </View>

        <View>
          <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {firstName ? t('admin.workoutsScreen.plansOf', { name: firstName }) : t('admin.workoutsScreen.registeredPlans')}
          </Text>

          {isLoading ? <LoadingIndicator message={t('admin.workoutsScreen.loading')} /> : null}

          {!isLoading && plans.length === 0 ? (
            <EmptyState
              icon="barbell-outline"
              title={t('admin.workoutsScreen.noPlansTitle')}
              description={t('admin.workoutsScreen.noPlansDescription')}
            />
          ) : null}

          <View className="gap-3">
            {plans.map((plan) => (
              <View key={plan.id} className="rounded-card border border-line bg-surface p-5">
                {editingPlanId === plan.id ? (
                  <View className="gap-3">
                    <TextField
                      label={t('admin.programForm.title')}
                      value={editTitleDraft}
                      onChangeText={setEditTitleDraft}
                      placeholder="Treino A"
                      icon="barbell-outline"
                    />
                    <TextField
                      label={t('admin.schedule.notesLabel')}
                      value={editDescriptionDraft}
                      onChangeText={setEditDescriptionDraft}
                      placeholder="Membros inferiores · 45 min"
                      icon="document-text-outline"
                    />
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => void handleSaveEdit(plan)}
                        disabled={isSavingEdit}
                        className="flex-1 items-center rounded-xl bg-primary py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-background">
                          {isSavingEdit ? t('admin.workoutsScreen.saving') : t('common.save')}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={cancelEdit}
                        disabled={isSavingEdit}
                        className="flex-1 items-center rounded-xl bg-elevated py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm text-muted">{t('common.cancel')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <Pressable
                      onPress={() => openPlan(plan.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t('admin.workoutsScreen.openPlanLabel', { title: plan.title })}
                    >
                      <Text className="text-lg font-semibold text-ink">
                        {plan.title || t('workoutDetail.fallbackTitle')}
                      </Text>
                      <Text className="mt-1 text-xs text-muted">
                        {t(
                          plan.exerciseCount === 1
                            ? 'admin.studentSpace.exerciseCountOne'
                            : 'admin.studentSpace.exerciseCountOther',
                          { count: String(plan.exerciseCount) },
                        )}{' '}
                        ·{' '}
                        {plan.isPublished
                          ? t('admin.workoutsScreen.statusPublished')
                          : t('admin.workoutsScreen.statusDraft')}
                      </Text>
                    </Pressable>
                    <View className="mt-4 flex-row gap-3 border-t border-line pt-3">
                      <Pressable
                        onPress={() => openPlan(plan.id)}
                        className="flex-1 items-center rounded-xl bg-primary/10 py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-primary">{t('admin.workoutsScreen.open')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => startEdit(plan)}
                        className="flex-1 items-center rounded-xl bg-elevated py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-ink">{t('common.edit')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(plan)}
                        disabled={busyPlanId === plan.id}
                        className="flex-1 items-center rounded-xl bg-red-500/10 py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-red-500">
                          {busyPlanId === plan.id ? t('admin.programsList.deleting') : t('common.delete')}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3 rounded-card border border-dashed border-line p-5">
          <Text className="text-sm font-semibold text-muted">{t('admin.workoutsScreen.sampleShortcutTitle')}</Text>
          <Text className="text-xs leading-5 text-faint">{t('admin.workoutsScreen.sampleShortcutHint')}</Text>
          <Button
            variant="secondary"
            label={t('admin.workoutsScreen.sampleShortcutButton')}
            loading={isBootstrapping}
            onPress={() => void handleBootstrapSamples()}
          />
        </View>
      </ScrollView>
    </AdminShell>
  );
}
