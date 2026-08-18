import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import { WEEKDAY_LABELS, WEEKDAYS, type TrainingSlot, type Weekday } from '@/domain/schedule';
import type { StudentProfile } from '@/domain/student';
import {
  adminCreateTrainingSlot,
  adminDeleteTrainingSlot,
  adminUpdateTrainingSlot,
  getDataErrorMessage,
  listTrainingSlots,
} from '@/services';
import { Button, ErrorState, LoadingIndicator, TextField } from '@/shared/components';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminScheduleScreen() {
  const { user } = useAuth();
  const { focusedStudentId, student: focusedStudent, goBackToStudent } = useAdminFocusedStudent();
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [startTime, setStartTime] = useState('07:00');
  const [duration, setDuration] = useState('60');
  const [title, setTitle] = useState('Treino da semana');
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
    setTitle('Treino da semana');
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
      setError('Selecione um aluno para agendar o treino.');
      return;
    }

    const durationMinutes = Number.parseInt(duration, 10);
    if (!/^\d{2}:\d{2}$/.test(startTime.trim())) {
      setError('Informe o horário no formato HH:MM.');
      return;
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 180) {
      setError('Informe uma duração entre 15 e 180 minutos.');
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
          title: title.trim() || 'Treino',
          notes: notes || undefined,
        });
      } else if (targetStudent) {
        await adminCreateTrainingSlot({
          studentUserId: targetStudent.userId,
          weekday,
          startTime: startTime.trim(),
          durationMinutes,
          title: title.trim() || 'Treino',
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
      title={firstName ? `Agenda de ${firstName}` : 'Agenda'}
      subtitle={
        focusedStudent
          ? `Horários só de ${focusedStudent.name}.`
          : 'Defina os horários de treino de cada aluno.'
      }
      showBack
      onBack={goBackToStudent}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando agenda..." /> : null}

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
                {editingSlotId ? 'Editar horário' : 'Novo horário'}
              </Text>
              {editingSlotId ? (
                <Pressable onPress={resetForm}>
                  <Text className="text-sm text-muted">Cancelar</Text>
                </Pressable>
              ) : null}
            </View>
            {editingSlotId ? null : focusedStudentId ? (
              <Text className="text-sm text-muted">
                Individual: {focusedStudent?.name ?? 'este aluno'}
              </Text>
            ) : (
              <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
            )}
            <Text className="text-sm font-medium text-muted">Dia da semana</Text>
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
                    {WEEKDAY_LABELS[day].slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextField
              label="Horário (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="07:00"
              icon="time-outline"
            />
            <TextField
              label="Duração (minutos)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="60"
              icon="hourglass-outline"
            />
            <TextField
              label="Título"
              value={title}
              onChangeText={setTitle}
              placeholder="Lower body"
              icon="barbell-outline"
            />
            <TextField
              label="Observações"
              value={notes}
              onChangeText={setNotes}
              placeholder="Levar toalha e garrafa"
              icon="chatbubble-outline"
            />
            <Button
              label={
                editingSlotId
                  ? 'Salvar alterações'
                  : firstName
                    ? `Salvar horário de ${firstName}`
                    : 'Agendar treino'
              }
              loading={isSaving}
              onPress={() => void handleSave()}
            />
          </View>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-ink">
              {firstName ? `Horários de ${firstName}` : 'Horários cadastrados'}
            </Text>
            {slots.length === 0 ? (
              <Text className="text-muted">Nenhum horário ainda.</Text>
            ) : (
              slots.map((slot) => (
                <View key={slot.id} className="rounded-card border border-line bg-surface p-5">
                  <Text className="font-semibold text-ink">
                    {WEEKDAY_LABELS[slot.weekday]} · {slot.startTime}
                  </Text>
                  <Text className="mt-1 text-sm text-ink">{slot.title}</Text>
                  <Text className="mt-1 text-xs text-muted">
                    {slot.durationMinutes} min
                    {slot.notes ? ` · ${slot.notes}` : ''}
                  </Text>
                  <View className="mt-3 flex-row gap-4">
                    <Pressable onPress={() => handleStartEdit(slot)}>
                      <Text className="text-sm font-semibold text-primary">Editar</Text>
                    </Pressable>
                    <Pressable onPress={() => void handleDelete(slot.id)}>
                      <Text className="text-sm text-red-400">Remover</Text>
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
