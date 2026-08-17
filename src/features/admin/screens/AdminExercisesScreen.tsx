import { AdminShell, VideoUploadField, type PickedVideo } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '@/domain/workout';
import {
  createExercise,
  deleteExercise,
  getDataErrorMessage,
  listExercises,
  updateExercise,
  uploadExerciseVideo,
} from '@/services';
import { isPlayableVideoUrl } from '@/shared/utils';
import { Button, TextField } from '@/shared/components';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminExercisesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('pernas');
  const [pickedVideo, setPickedVideo] = useState<PickedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingExerciseId, setUploadingExerciseId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setExercises(await listExercises());
    } catch (err) {
      setError(getDataErrorMessage(err));
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

    setIsSaving(true);
    setError(null);

    try {
      const created = await createExercise({
        name,
        description: description || undefined,
        muscleGroup,
        videoUrl: 'pending-upload',
        createdBy: user.id,
      });

      if (pickedVideo) {
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
      }

      setName('');
      setDescription('');
      setPickedVideo(null);
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAttachVideo(exercise: Exercise, file: PickedVideo) {
    setUploadingExerciseId(exercise.id);
    setError(null);
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
      title="Exercícios"
      subtitle="Cadastre o movimento, escolha o grupo muscular e anexe o vídeo."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

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
          {exercises.length === 0 ? (
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
