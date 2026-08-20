import { AdminShell, VideoUploadField, type PickedVideo } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '@/domain/workout';
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
import { useT } from '@/shared/theme';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminExercisesScreen() {
  const t = useT();
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
          t('admin.exercises.loadTimeout'),
        ),
      );
      setError(null);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!user || name.trim().length < 2) {
      setError(t('admin.exercises.nameRequired'));
      return;
    }

    if (!pickedVideo) {
      setError(t('admin.exercises.videoRequired'));
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
            `${getDataErrorMessage(uploadError)} ${t('admin.exercises.savedButVideoFailed')}`,
          );
        }
      }

      setName('');
      setDescription('');
      setPickedVideo(null);
      await load();
      if (firstName) {
        setNotice(t('admin.exercises.savedNoticeFor', { name: firstName }));
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
        t('admin.exercises.bootstrapDone', {
          count: String(result.exerciseCount),
          titles: result.planTitles.join(' / '),
        }) +
          ' ' +
          (firstName
            ? t('admin.exercises.bootstrapDoneFor', { name: firstName })
            : t('admin.exercises.bootstrapDoneGeneric')),
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
      title={firstName ? t('admin.exercises.titleFor', { name: firstName }) : t('admin.dashboard.exercisesShort')}
      subtitle={
        focusedStudent
          ? t('admin.exercises.subtitleFor', { name: focusedStudent.name })
          : t('admin.exercises.subtitleGeneric')
      }
      showBack
      onBack={goBackToStudent}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

        <View className="gap-3 rounded-card border border-primary/30 bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">{t('admin.exercises.videosFolder')}</Text>
          <Text className="text-sm leading-5 text-muted">{t('admin.exercises.videosFolderHint')}</Text>
          <Button
            label={t('admin.exercises.bootstrapButton')}
            loading={isBootstrapping}
            onPress={() => void handleBootstrapSamples()}
          />
        </View>

        <View className="gap-4 rounded-card border border-line bg-surface p-5">
          <Text className="text-lg font-semibold text-ink">{t('admin.exercises.newExercise')}</Text>
          <TextField
            label={t('admin.exercises.nameLabel')}
            value={name}
            onChangeText={setName}
            placeholder="Agachamento livre"
            icon="barbell-outline"
          />
          <TextField
            label={t('admin.exercises.howToLabel')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('admin.exercises.howToPlaceholder')}
            icon="document-text-outline"
          />
          <Text className="text-sm font-medium text-muted">{t('admin.exercises.muscleGroupLabel')}</Text>
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
                  {t(`muscleGroups.${group}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          <VideoUploadField
            isUploading={isSaving}
            onPick={setPickedVideo}
            currentUrl={pickedVideo?.name ?? undefined}
          />
          <Button label={t('admin.exercises.saveExercise')} loading={isSaving} onPress={() => void handleCreate()} />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">{t('admin.exercises.catalog')}</Text>
          {isLoading ? <Text className="text-sm text-muted">{t('admin.exercises.loading')}</Text> : null}
          {!isLoading && exercises.length === 0 ? (
            <Text className="text-sm text-muted">{t('admin.exercises.noneYet')}</Text>
          ) : null}
          {exercises.map((exercise) => (
            <View key={exercise.id} className="rounded-card border border-line bg-surface p-4">
              <Text className="font-semibold text-ink">{exercise.name}</Text>
              <Text className="mt-1 text-xs text-muted">
                {t(`muscleGroups.${exercise.muscleGroup}`)}
                {isPlayableVideoUrl(exercise.videoUrl)
                  ? ` · ${t('admin.exercises.videoOk')}`
                  : ` · ${t('admin.exercises.videoMissing')}`}
              </Text>
              <View className="mt-3">
                <VideoUploadField
                  compact
                  isUploading={uploadingExerciseId === exercise.id}
                  currentUrl={
                    isPlayableVideoUrl(exercise.videoUrl) ? t('admin.exercises.videoSent') : undefined
                  }
                  onPick={(file) => void handleAttachVideo(exercise, file)}
                />
              </View>
              <Pressable
                className="mt-3"
                onPress={() =>
                  void deleteExercise(exercise.id)
                    .then(load)
                    .catch((err) => setError(getDataErrorMessage(err)))
                }
              >
                <Text className="text-sm text-red-400">{t('common.remove')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AdminShell>
  );
}
