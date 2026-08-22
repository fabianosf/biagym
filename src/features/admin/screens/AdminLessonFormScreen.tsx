import { colors, useT } from '@/shared/theme';
import {
  AdminShell,
  VideoUploadField,
  type PickedVideo,
} from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { Button, ErrorState, LoadingIndicator } from '@/shared/components';
import {
  adminCreateLesson,
  adminDeleteLesson,
  adminGetNextLessonOrder,
  adminUpdateLesson,
  getAdminProgramDetail,
  getDataErrorMessage,
  notifyNewLesson,
  uploadLessonVideo,
} from '@/services';
import type { Week } from '@/domain/program';
import { resolveRouteParam } from '@/shared/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

export function AdminLessonFormScreen() {
  const router = useRouter();
  const t = useT();
  const params = useLocalSearchParams<{
    id?: string | string[];
    lessonId?: string | string[];
    weekId?: string | string[];
  }>();

  const programId = resolveRouteParam(params.id);
  const isEditing = Boolean(resolveRouteParam(params.lessonId));
  const selectedLessonId = resolveRouteParam(params.lessonId);
  const weekIdParam = resolveRouteParam(params.weekId);

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [programTitle, setProgramTitle] = useState('');
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('1');
  const [durationSeconds, setDurationSeconds] = useState('600');
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [pickedVideo, setPickedVideo] = useState<PickedVideo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!programId) {
      setError(t('admin.programDetail.invalidId'));
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const detail = await getAdminProgramDetail(programId);
      if (!detail) {
        setError(t('program.notFoundTitle'));
        return;
      }

      const weekList = detail.weeks.map(({ week }) => week);
      setWeeks(weekList);
      setProgramTitle(detail.program.title);

      const initialWeekId = weekIdParam ?? weekList[0]?.id ?? '';

      if (isEditing && selectedLessonId) {
        const lesson = detail.weeks
          .flatMap(({ lessons }) => lessons)
          .find((item) => item.id === selectedLessonId);

        if (!lesson) {
          setError(t('admin.lessonForm.lessonNotFound'));
          return;
        }

        setTitle(lesson.title);
        setDescription(lesson.description ?? '');
        setSelectedWeekId(lesson.weekId);
        setOrder(String(lesson.order));
        setDurationSeconds(String(lesson.durationSeconds));
        setIsFreePreview(Boolean(lesson.isFreePreview));
        setVideoUrl(lesson.videoUrl);
      } else {
        setSelectedWeekId(initialWeekId);
        if (initialWeekId) {
          const nextOrder = await adminGetNextLessonOrder(initialWeekId);
          setOrder(String(nextOrder));
        }
      }
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, programId, selectedLessonId, weekIdParam, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!programId || !selectedWeekId) {
      setError(t('admin.lessonForm.selectWeek'));
      return;
    }

    const parsedOrder = Number.parseInt(order, 10);
    const parsedDuration = Number.parseInt(durationSeconds, 10);

    if (!title.trim() || Number.isNaN(parsedOrder) || Number.isNaN(parsedDuration)) {
      setError(t('admin.lessonForm.validationError'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let lessonRecordId = selectedLessonId;
      let finalVideoUrl = videoUrl.trim();
      let createdLessonId: string | null = null;

      if (isEditing && selectedLessonId) {
        await adminUpdateLesson(selectedLessonId, {
          weekId: selectedWeekId,
          title: title.trim(),
          description: description.trim() || null,
          order: parsedOrder,
          durationSeconds: parsedDuration,
          isFreePreview,
        });
      } else {
        if (!finalVideoUrl && !pickedVideo) {
          setError(t('admin.lessonForm.videoRequired'));
          setIsSaving(false);
          return;
        }

        const created = await adminCreateLesson({
          programId,
          weekId: selectedWeekId,
          title: title.trim(),
          description: description.trim() || undefined,
          videoUrl: finalVideoUrl || 'pending-upload',
          durationSeconds: parsedDuration,
          order: parsedOrder,
          isFreePreview,
        });
        lessonRecordId = created.id;
        createdLessonId = created.id;
      }

      if (pickedVideo && lessonRecordId) {
        setIsUploading(true);
        try {
          finalVideoUrl = await uploadLessonVideo({
            programId,
            lessonId: lessonRecordId,
            fileUri: pickedVideo.uri,
            mimeType: pickedVideo.mimeType,
            fileName: pickedVideo.name,
          });
          await adminUpdateLesson(lessonRecordId, { videoUrl: finalVideoUrl });
          setVideoUrl(finalVideoUrl);
          setPickedVideo(null);
        } catch (uploadError) {
          if (createdLessonId) {
            await adminDeleteLesson(createdLessonId).catch(() => undefined);
          }
          throw uploadError;
        } finally {
          setIsUploading(false);
        }
      }

      setSuccess(t('admin.lessonForm.savedSuccess'));
      if (!isEditing && lessonRecordId) {
        void notifyNewLesson(programId, programTitle, title.trim());
        router.replace(adminRoutes.lessonEdit(programId, lessonRecordId));
      }
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }

  return (
    <AdminShell
      title={isEditing ? t('admin.lessonForm.editTitle') : t('admin.lessonForm.newTitle')}
      subtitle={t('admin.lessonForm.subtitle')}
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message={t('admin.lessonForm.loading')} /> : null}

      {!isLoading && error && !title && !videoUrl ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 py-4 pb-10">
          <View>
            <Text className="mb-2 text-sm text-muted">{t('admin.lessonForm.weekLabel')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {weeks.map((week) => (
                <Pressable
                  key={week.id}
                  onPress={() => setSelectedWeekId(week.id)}
                  className={`rounded-full px-3 py-2 ${
                    selectedWeekId === week.id ? 'bg-primary' : 'bg-elevated'
                  }`}
                >
                  <Text
                    className={
                      selectedWeekId === week.id
                        ? 'font-semibold text-background'
                        : 'text-muted'
                    }
                  >
                    {t('admin.programDetail.weekNumber', { number: String(week.weekNumber) })}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm text-muted">{t('admin.programForm.title')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className="rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
              placeholderTextColor="#9B9B9B"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm text-muted">{t('admin.programForm.description')}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              className="min-h-[80px] rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
              placeholderTextColor="#9B9B9B"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-sm text-muted">{t('admin.lessonForm.orderLabel')}</Text>
              <TextInput
                value={order}
                onChangeText={setOrder}
                keyboardType="numeric"
                className="rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-sm text-muted">{t('admin.lessonForm.durationLabel')}</Text>
              <TextInput
                value={durationSeconds}
                onChangeText={setDurationSeconds}
                keyboardType="numeric"
                className="rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5">
            <Text className="text-ink">{t('admin.lessonForm.freePreview')}</Text>
            <Switch
              value={isFreePreview}
              onValueChange={setIsFreePreview}
              trackColor={{ false: '#ECECEC', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm text-muted">{t('admin.lessonForm.videoUrlLabel')}</Text>
            <TextInput
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('admin.lessonForm.videoUrlPlaceholder')}
              placeholderTextColor="#9B9B9B"
              className="rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
            />
            <Text className="mt-1 text-xs text-faint">{t('admin.lessonForm.videoUrlHint')}</Text>
          </View>

          <VideoUploadField
            label={t('admin.lessonForm.videoFieldLabel')}
            currentUrl={videoUrl || undefined}
            isUploading={isUploading}
            onPick={setPickedVideo}
          />

          {pickedVideo ? (
            <Text className="text-xs text-primary">
              {t('admin.lessonForm.videoSelected', {
                name: pickedVideo.name ?? t('admin.lessonForm.localFile'),
              })}
            </Text>
          ) : null}

          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          {success ? <Text className="text-sm text-primary">{success}</Text> : null}

          <Button
            disabled={isSaving || isUploading}
            loading={isSaving || isUploading}
            onPress={() => void handleSave()}
            label={t('admin.lessonForm.saveLesson')}
          />
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
