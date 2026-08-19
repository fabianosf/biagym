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
          'As fichas demoraram demais para carregar. Tente de novo.',
        ),
      );
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const plan = await withTimeout(
        createTrainingPlan({
          title,
          slug: slugifyPlanTitle(title),
          description: description || undefined,
          createdBy: user.id,
          sortOrder: plans.length,
        }),
        DATA_FETCH_TIMEOUT_MS,
        'A ficha demorou demais para ser criada. Tente de novo.',
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
        'O cadastro dos treinos de exemplo demorou demais. Verifique a conexão e tente de novo.',
      );
      successHaptic();
      await load(true);
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
      await withTimeout(
        deleteTrainingPlan(plan.id),
        DATA_FETCH_TIMEOUT_MS,
        'Não foi possível excluir a ficha agora. Tente de novo.',
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
      'Excluir ficha',
      `"${plan.title || 'Treino'}" e todos os exercícios dela serão removidos. ${
        plan.isPublished ? 'Quem tinha acesso perde esta ficha. ' : ''
      }Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => void handleDelete(plan) },
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
      setError('Dê um título pra ficha antes de salvar.');
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
        'Não foi possível salvar agora. Tente de novo.',
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
      title={firstName ? `Fichas para ${firstName}` : 'Catálogo de treinos'}
      subtitle={
        focusedStudent
          ? `O que você publicar nesta tela vai para ${focusedStudent.name}.`
          : 'Aqui você monta a ficha. Para o aluno receber, entre no espaço dele.'
      }
      showBack={router.canGoBack()}
      onBack={goBackToStudent}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-28">
        {error ? <FeedbackBanner message={error} variant="warning" /> : null}
        {notice ? <FeedbackBanner message={notice} variant="success" /> : null}

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
            placeholder="Treino A, B, C... o nome que quiser"
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

        <View>
          <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {firstName ? `Fichas de ${firstName}` : 'Fichas cadastradas'}
          </Text>

          {isLoading ? <LoadingIndicator message="Carregando fichas..." /> : null}

          {!isLoading && plans.length === 0 ? (
            <EmptyState
              icon="barbell-outline"
              title="Nenhuma ficha ainda"
              description="Crie o Treino A, B, C — ou qualquer nome — no formulário acima."
            />
          ) : null}

          <View className="gap-3">
            {plans.map((plan) => (
              <View key={plan.id} className="rounded-card border border-line bg-surface p-5">
                {editingPlanId === plan.id ? (
                  <View className="gap-3">
                    <TextField
                      label="Título"
                      value={editTitleDraft}
                      onChangeText={setEditTitleDraft}
                      placeholder="Treino A"
                      icon="barbell-outline"
                    />
                    <TextField
                      label="Descrição"
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
                          {isSavingEdit ? 'Salvando...' : 'Salvar'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={cancelEdit}
                        disabled={isSavingEdit}
                        className="flex-1 items-center rounded-xl bg-elevated py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm text-muted">Cancelar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
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
                    <View className="mt-4 flex-row gap-3 border-t border-line pt-3">
                      <Pressable
                        onPress={() => openPlan(plan.id)}
                        className="flex-1 items-center rounded-xl bg-primary/10 py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-primary">Abrir</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => startEdit(plan)}
                        className="flex-1 items-center rounded-xl bg-elevated py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-ink">Editar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(plan)}
                        disabled={busyPlanId === plan.id}
                        className="flex-1 items-center rounded-xl bg-red-500/10 py-2.5 active:opacity-85"
                      >
                        <Text className="text-sm font-semibold text-red-500">
                          {busyPlanId === plan.id ? 'Excluindo...' : 'Excluir'}
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
          <Text className="text-sm font-semibold text-muted">Atalho: ficha de exemplo</Text>
          <Text className="text-xs leading-5 text-faint">
            Sobe MP4s de exemplo, cria os exercícios e monta Treino A e Treino B prontos, com
            séries, reps, carga e descanso já preenchidos. Útil só pra testar o app.
          </Text>
          <Button
            variant="secondary"
            label="Cadastrar exemplo com vídeos"
            loading={isBootstrapping}
            onPress={() => void handleBootstrapSamples()}
          />
        </View>
      </ScrollView>
    </AdminShell>
  );
}
