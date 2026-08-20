import { colors, useT } from '@/shared/theme';
import { AdminShell } from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { ErrorState, LoadingIndicator } from '@/shared/components';
import {
  adminCreateWeek,
  adminDeleteLesson,
  adminDeleteWeek,
  adminSetProgramPublished,
  adminUpdateWeek,
  getAdminProgramDetail,
  getDataErrorMessage,
} from '@/services';
import type { ProgramDetail } from '@/domain/program';
import { resolveRouteParam } from '@/shared/utils';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

export function AdminProgramDetailScreen() {
  const router = useRouter();
  const t = useT();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const programId = resolveRouteParam(params.id);

  const [detail, setDetail] = useState<ProgramDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [weekTitleDraft, setWeekTitleDraft] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!programId) {
      setDetail(null);
      setError(t('admin.programDetail.invalidId'));
      setIsLoading(false);
      return;
    }

    if (silent) {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await getAdminProgramDetail(programId);
      setDetail(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [programId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddWeek() {
    if (!programId || !detail) {
      return;
    }

    const nextNumber = detail.weeks.length + 1;
    try {
      await adminCreateWeek({
        programId,
        weekNumber: nextNumber,
        title: t('admin.programDetail.weekNumber', { number: String(nextNumber) }),
      });
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  async function handleTogglePublish() {
    if (!programId || !detail) {
      return;
    }

    try {
      await adminSetProgramPublished(programId, !detail.program.isPublished);
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  async function handleSaveWeekTitle(weekId: string) {
    try {
      await adminUpdateWeek(weekId, { title: weekTitleDraft.trim() || null });
      setEditingWeekId(null);
      setWeekTitleDraft('');
      await load();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  function confirmDeleteWeek(weekId: string) {
    Alert.alert(t('admin.programDetail.deleteWeekTitle'), t('admin.programDetail.deleteWeekMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await adminDeleteWeek(weekId);
              await load();
            } catch (err) {
              setError(getDataErrorMessage(err));
            }
          })();
        },
      },
    ]);
  }

  function confirmDeleteLesson(lessonId: string) {
    Alert.alert(t('admin.programDetail.deleteLessonTitle'), t('admin.programDetail.deleteLessonMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await adminDeleteLesson(lessonId);
              await load();
            } catch (err) {
              setError(getDataErrorMessage(err));
            }
          })();
        },
      },
    ]);
  }

  return (
    <AdminShell
      title={detail?.program.title ?? t('program.fallbackTitle')}
      subtitle={t('admin.programDetail.subtitle')}
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message={t('admin.programDetail.loading')} /> : null}

      {!isLoading && error && !detail ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading && detail && programId ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 py-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
        >
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => void handleTogglePublish()}
              className={`rounded-full px-3 py-2 ${
                detail.program.isPublished ? 'bg-primary/20' : 'bg-elevated'
              }`}
            >
              <Text className={detail.program.isPublished ? 'text-primary' : 'text-muted'}>
                {t('admin.programDetail.publishToggle', {
                  status: detail.program.isPublished
                    ? t('admin.programForm.published')
                    : t('admin.programForm.draft'),
                })}
              </Text>
            </Pressable>
            <Link href={adminRoutes.programEdit(programId)} asChild>
              <Pressable className="rounded-full bg-elevated px-3 py-2">
                <Text className="text-muted">{t('admin.programDetail.editMetadata')}</Text>
              </Pressable>
            </Link>
          </View>

          <Pressable
            onPress={() => void handleAddWeek()}
            className="min-h-[52px] items-center justify-center rounded-2xl border border-primary/40"
          >
            <Text className="font-semibold text-primary">{t('admin.programDetail.addWeek')}</Text>
          </Pressable>

          {detail.weeks.length === 0 ? (
            <Text className="text-muted">{t('admin.programDetail.noWeeks')}</Text>
          ) : (
            detail.weeks.map(({ week, lessons }) => (
              <View
                key={week.id}
                className="overflow-hidden rounded-card border border-line bg-surface"
              >
                <View className="flex-row items-center justify-between border-b border-line px-5 py-4">
                  <View className="flex-1 pr-3">
                    {editingWeekId === week.id ? (
                      <View className="gap-2">
                        <TextInput
                          value={weekTitleDraft}
                          onChangeText={setWeekTitleDraft}
                          placeholder={t('admin.programDetail.weekNumber', { number: String(week.weekNumber) })}
                          placeholderTextColor="#9B9B9B"
                          className="rounded-2xl border border-line bg-elevated px-3 py-2.5 text-ink"
                        />
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => void handleSaveWeekTitle(week.id)}
                            className="rounded-xl bg-primary px-3 py-1.5"
                          >
                            <Text className="text-xs font-semibold text-background">{t('common.save')}</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setEditingWeekId(null);
                              setWeekTitleDraft('');
                            }}
                            className="rounded-xl bg-elevated px-3 py-1.5"
                          >
                            <Text className="text-xs text-muted">{t('common.cancel')}</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setEditingWeekId(week.id);
                          setWeekTitleDraft(week.title ?? '');
                        }}
                      >
                        <Text className="font-semibold text-ink">
                          {t('admin.programDetail.weekNumber', { number: String(week.weekNumber) })}
                          {week.title ? ` · ${week.title}` : ''}
                        </Text>
                        <Text className="mt-1 text-xs text-faint">{t('admin.programDetail.tapToEditTitle')}</Text>
                      </Pressable>
                    )}
                  </View>
                  <Pressable onPress={() => confirmDeleteWeek(week.id)}>
                    <Text className="text-xs text-red-400">{t('common.delete')}</Text>
                  </Pressable>
                </View>

                <View className="gap-2 p-3">
                  {lessons.map((lesson) => (
                    <View
                      key={lesson.id}
                      className="flex-row items-center rounded-2xl border border-line px-3 py-3"
                    >
                      <View className="flex-1">
                        <Text className="font-medium text-ink">{lesson.title}</Text>
                        <Text className="mt-1 text-xs text-muted">
                          {t('admin.programDetail.lessonMeta', {
                            order: String(lesson.order),
                            minutes: String(Math.round(lesson.durationSeconds / 60)),
                          })}
                          {lesson.isFreePreview ? ` · ${t('admin.programDetail.preview')}` : ''}
                        </Text>
                      </View>
                      <Link
                        href={adminRoutes.lessonEdit(programId, lesson.id)}
                        asChild
                      >
                        <Pressable className="mr-3 rounded-xl bg-elevated px-3 py-1.5">
                          <Text className="text-xs text-ink">{t('common.edit')}</Text>
                        </Pressable>
                      </Link>
                      <Pressable onPress={() => confirmDeleteLesson(lesson.id)}>
                        <Text className="text-xs text-red-400">{t('common.delete')}</Text>
                      </Pressable>
                    </View>
                  ))}

                  <Link href={adminRoutes.lessonNew(programId, week.id)} asChild>
                    <Pressable className="items-center rounded-2xl border border-dashed border-line py-3">
                      <Text className="text-sm text-muted">{t('admin.programDetail.newLesson')}</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            ))
          )}

          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
