import { AdminShell, VideoUploadField, type PickedVideo } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '@/domain/workout';
import {
  DATA_FETCH_TIMEOUT_MS,
  bootstrapSampleGymCatalog,
  createExercise,
  deleteExercise,
  getDataErrorMessage,
  listExercises,
  updateExercise,
  uploadExerciseVideo,
  withTimeout,
} from '@/services';
import { isPlayableVideoUrl } from '@/shared/utils';
import { Button, TextField } from '@/shared/components';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminExercisesScreen() {
  const { user } = useAuth();
  const { student: focusedStudent, goBackToStudent } = useAdminFocusedStudent();
  const firstName = focusedStudent ? getStudentFirstName(focusedStudent.name) : null;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('pernas');
  const [pickedVideo, setPickedVideo] = useState<PickedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingExerciseId, setUploadingExerciseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const load = useCallback(async () => {
    try {
      setExercises(
        await withTimeout(
          listExercises(),
          DATA_FETCH_TIMEOUT_MS,
          'Os exercícios demoraram demais para carregar. Tente novamente.',
        ),
      );
      setError(null);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!user || name.trim().length < 2) {
      setError('Informe o nome do exercício.');
      return;
    }

    if (!pickedVideo) {
      setError('Selecione um vídeo da pasta videos/ ou do aparelho.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const created = await createExercise({
        name,
        description: description || undefined,
        muscleGroup,
        videoUrl: 'pending-upload',
        createdBy: user.id,
      });

      if (pickedVideo) {
        try {
          const videoUrl = await uploadExerciseVideo({
            exerciseId: created.id,
            fileUri: pickedVideo.uri,
            mimeType: pickedVideo.mimeType,
            fileName: pickedVideo.name,
          });
          await updateExercise(created.id, {
            name: created.name,
            description: created.description,
            muscleGroup: created.muscleGroup,
            videoUrl,
          });
        } catch (uploadError) {
          setError(
            `${getDataErrorMessage(uploadError)} O exercício foi salvo. Anexe o vídeo de novo na lista.`,
          );
        }
      }

      setName('');
      setDescription('');
      setPickedVideo(null);
      await load();
      if (firstName) {
        setNotice(`Exercício salvo. Volte e inclua na ficha de ${firstName}.`);
      }
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
      setPickedVideo(null);
      setName('');
      setDescription('');
      setNotice(
        `Exemplos prontos: ${result.exerciseCount} exercícios e ${result.planTitles.join(' / ')}.${
          firstName
            ? ` Volte ao espaço de ${firstName} e libere o treino.`
            : ' Abra o aluno e libere o treino no espaço dele.'
        }`,
      );
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleAttachVideo(exercise: Exercise, file: PickedVideo) {
    setUploadingExerciseId(exercise.id);
    setError(null);
    setNotice(null);
    try {
      const videoUrl = await uploadExerciseVideo({
        exerciseId: exercise.id,
        fileUri: file.uri,
        mimeType: file.mimeType,
        fileName: file.name,
      });
      await updateExercise(exercise.id, {
        name: exercise.name,
        description: exercise.description,
        muscleGroup: exercise.muscleGroup,
        videoUrl,
      });
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setUploadingExerciseId(null);
    }
  }

  return (
    <AdminShell
      title={firstName ? `Exercícios para ${firstName}` : 'Exercícios'}
      subtitle={
        focusedStudent
          ? `Cadastre o movimento e o vídeo. Depois inclua na ficha de ${focusedStudent.name}.`
          : 'Cadastre o movimento, escolha o grupo muscular e anexe o vídeo.'
      }
      showBack
      onBack={goBackToStudent}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

        <View className="gap-3 rounded-card border border-primary/30 bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">Pasta videos/</Text>
          <Text className="text-sm leading-5 text-muted">
            Cadastra video1 a video5, monta Treino A (video1 + video2) e Treino B (video3 + video4)
            com séries, reps, carga e descanso. Depois libere o aluno.
          </Text>
          <Button
            label="Cadastrar exemplos da pasta videos/"
            loading={isBootstrapping}
            onPress={() => void handleBootstrapSamples()}
          />
        </View>

        <View className="gap-4 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">Novo exercício</Text>
          <TextField
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Agachamento livre"
            icon="barbell-outline"
          />
          <TextField
            label="Como executar"
            value={description}
            onChangeText={setDescription}
            placeholder="Pés na largura do quadril..."
            icon="document-text-outline"
          />
          <Text className="text-sm font-medium text-muted">Grupo muscular</Text>
          <View className="flex-row flex-wrap gap-2">
            {MUSCLE_GROUPS.map((group) => (
              <Pressable
                key={group}
                onPress={() => setMuscleGroup(group)}
                className={`rounded-full px-3 py-2 ${
                  muscleGroup === group ? 'bg-primary' : 'bg-elevated'
                }`}
              >
                <Text className={muscleGroup === group ? 'font-semibold text-white' : 'text-ink'}>
                  {MUSCLE_GROUP_LABELS[group]}
                </Text>
              </Pressable>
            ))}
          </View>
          <VideoUploadField
            isUploading={isSaving}
            onPick={setPickedVideo}
            currentUrl={pickedVideo?.name ?? undefined}
          />
          <Button label="Salvar exercício" loading={isSaving} onPress={() => void handleCreate()} />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">Catálogo</Text>
          {isLoading ? <Text className="text-sm text-muted">Carregando exercícios...</Text> : null}
          {!isLoading && exercises.length === 0 ? (
            <Text className="text-sm text-muted">Nenhum exercício cadastrado ainda.</Text>
          ) : null}
          {exercises.map((exercise) => (
            <View key={exercise.id} className="rounded-card border border-line bg-surface p-4">
              <Text className="font-semibold text-ink">{exercise.name}</Text>
              <Text className="mt-1 text-xs text-muted">
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                {isPlayableVideoUrl(exercise.videoUrl) ? ' · vídeo ok' : ' · sem vídeo'}
              </Text>
              <View className="mt-3">
                <VideoUploadField
                  compact
                  isUploading={uploadingExerciseId === exercise.id}
                  currentUrl={
                    isPlayableVideoUrl(exercise.videoUrl) ? 'Vídeo enviado' : undefined
                  }
                  onPick={(file) => void handleAttachVideo(exercise, file)}
                />
              </View>
              <Pressable className="mt-3" onPress={() => void deleteExercise(exercise.id).then(load)}>
                <Text className="text-sm text-red-400">Remover</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}
