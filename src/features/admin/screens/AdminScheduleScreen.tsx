import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import { WEEKDAYS, type TrainingSlot, type Weekday } from '@/domain/schedule';
import type { StudentProfile } from '@/domain/student';
import {
  adminCreateTrainingSlot,
  adminDeleteTrainingSlot,
  adminUpdateTrainingSlot,
  getDataErrorMessage,
  listTrainingSlots,
} from '@/services';
import { Button, ErrorState, LoadingIndicator, TextField } from '@/shared/components';
import { useT } from '@/shared/theme';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminScheduleScreen() {
  const t = useT();
  const { user } = useAuth();
  const { focusedStudentId, student: focusedStudent, goBackToStudent } = useAdminFocusedStudent();
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [startTime, setStartTime] = useState('07:00');
  const [duration, setDuration] = useState('60');
  const [title, setTitle] = useState(t('admin.schedule.defaultTitle'));
  const [notes, setNotes] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setError(null);
    try {
      const data = await listTrainingSlots(focusedStudentId || undefined);
      setSlots(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [focusedStudentId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (focusedStudent) {
      setSelectedStudent(focusedStudent);
    }
  }, [focusedStudent]);

  const firstName = focusedStudent ? getStudentFirstName(focusedStudent.name) : null;
  const targetStudent = focusedStudent ?? selectedStudent;

  function resetForm() {
    setEditingSlotId(null);
    setWeekday(1);
    setStartTime('07:00');
    setDuration('60');
    setTitle(t('admin.schedule.defaultTitle'));
    setNotes('');
  }

  function handleStartEdit(slot: TrainingSlot) {
    setEditingSlotId(slot.id);
    setWeekday(slot.weekday);
    setStartTime(slot.startTime.slice(0, 5));
    setDuration(String(slot.durationMinutes));
    setTitle(slot.title);
    setNotes(slot.notes ?? '');
    setError(null);
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    if (!editingSlotId && !targetStudent) {
      setError(t('admin.schedule.selectStudent'));
      return;
    }

    const durationMinutes = Number.parseInt(duration, 10);
    if (!/^\d{2}:\d{2}$/.test(startTime.trim())) {
      setError(t('admin.schedule.invalidTime'));
      return;
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 180) {
      setError(t('admin.schedule.invalidDuration'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingSlotId) {
        await adminUpdateTrainingSlot(editingSlotId, {
          weekday,
          startTime: startTime.trim(),
          durationMinutes,
          title: title.trim() || t('workoutDetail.fallbackTitle'),
          notes: notes || undefined,
        });
      } else if (targetStudent) {
        await adminCreateTrainingSlot({
          studentUserId: targetStudent.userId,
          weekday,
          startTime: startTime.trim(),
          durationMinutes,
          title: title.trim() || t('workoutDetail.fallbackTitle'),
          notes: notes || undefined,
          createdBy: user.id,
        });
      }
      resetForm();
      await loadSlots();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(slotId: string) {
    try {
      await adminDeleteTrainingSlot(slotId);
      if (editingSlotId === slotId) {
        resetForm();
      }
      await loadSlots();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  return (
    <AdminShell
      title={firstName ? t('admin.schedule.titleFor', { name: firstName }) : t('admin.schedule.title')}
      subtitle={
        focusedStudent
          ? t('admin.schedule.subtitleFor', { name: focusedStudent.name })
          : t('admin.schedule.subtitleGeneric')
      }
      showBack
      onBack={goBackToStudent}
    >
      {isLoading ? <LoadingIndicator fullScreen message={t('admin.schedule.loading')} /> : null}

      {!isLoading && error && slots.length === 0 ? (
        <View className="px-5 pt-2">
          <ErrorState message={error} onRetry={() => void loadSlots()} />
        </View>
      ) : null}

      {!isLoading && (slots.length > 0 || !error) ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

          <View className="rounded-card border border-line bg-surface p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-ink">
                {editingSlotId ? t('admin.schedule.editSlot') : t('admin.schedule.newSlot')}
              </Text>
              {editingSlotId ? (
                <Pressable onPress={resetForm}>
                  <Text className="text-sm text-muted">{t('common.cancel')}</Text>
                </Pressable>
              ) : null}
            </View>
            {editingSlotId ? null : focusedStudentId ? (
              <Text className="text-sm text-muted">
                {t('admin.schedule.individualFor', {
                  name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
                })}
              </Text>
            ) : (
              <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
            )}
            <Text className="text-sm font-medium text-muted">{t('admin.schedule.weekday')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => setWeekday(day)}
                  className={`rounded-full px-3 py-2 ${
                    weekday === day ? 'bg-primary' : 'bg-elevated'
                  }`}
                >
                  <Text className={weekday === day ? 'font-semibold text-white' : 'text-ink'}>
                    {t(`weekdaysShort.${day}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextField
              label={t('admin.schedule.timeLabel')}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="07:00"
              icon="time-outline"
            />
            <TextField
              label={t('admin.schedule.durationLabel')}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="60"
              icon="hourglass-outline"
            />
            <TextField
              label={t('admin.programForm.title')}
              value={title}
              onChangeText={setTitle}
              placeholder="Lower body"
              icon="barbell-outline"
            />
            <TextField
              label={t('admin.schedule.notesLabel')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('admin.schedule.notesPlaceholder')}
              icon="chatbubble-outline"
            />
            <Button
              label={
                editingSlotId
                  ? t('admin.schedule.saveChanges')
                  : firstName
                    ? t('admin.schedule.saveSlotFor', { name: firstName })
                    : t('admin.schedule.scheduleWorkout')
              }
              loading={isSaving}
              onPress={() => void handleSave()}
            />
          </View>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-ink">
              {firstName
                ? t('admin.schedule.slotsOf', { name: firstName })
                : t('admin.schedule.registeredSlots')}
            </Text>
            {slots.length === 0 ? (
              <Text className="text-muted">{t('admin.schedule.noSlotsYet')}</Text>
            ) : (
              slots.map((slot) => (
                <View key={slot.id} className="rounded-card border border-line bg-surface p-5">
                  <Text className="font-semibold text-ink">
                    {t(`weekdays.${slot.weekday}`)} · {slot.startTime}
                  </Text>
                  <Text className="mt-1 text-sm text-ink">{slot.title}</Text>
                  <Text className="mt-1 text-xs text-muted">
                    {t('admin.schedule.minutes', { minutes: String(slot.durationMinutes) })}
                    {slot.notes ? ` · ${slot.notes}` : ''}
                  </Text>
                  <View className="mt-3 flex-row gap-4">
                    <Pressable onPress={() => handleStartEdit(slot)}>
                      <Text className="text-sm font-semibold text-primary">{t('common.edit')}</Text>
                    </Pressable>
                    <Pressable onPress={() => void handleDelete(slot.id)}>
                      <Text className="text-sm text-red-400">{t('common.remove')}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
