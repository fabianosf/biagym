import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import { WEEKDAY_LABELS, WEEKDAYS, type TrainingSlot, type Weekday } from '@/domain/schedule';
import type { StudentProfile } from '@/domain/student';
import {
  adminCreateTrainingSlot,
  adminDeleteTrainingSlot,
  getDataErrorMessage,
  listTrainingSlots,
} from '@/services';
import { Button, LoadingIndicator, TextField } from '@/shared/components';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminScheduleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [startTime, setStartTime] = useState('07:00');
  const [duration, setDuration] = useState('60');
  const [title, setTitle] = useState('Treino da semana');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setError(null);
    try {
      const data = await listTrainingSlots();
      setSlots(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function handleCreate() {
    if (!user || !selectedStudent) {
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
      await adminCreateTrainingSlot({
        studentUserId: selectedStudent.userId,
        weekday,
        startTime: startTime.trim(),
        durationMinutes,
        title: title.trim() || 'Treino',
        notes: notes || undefined,
        createdBy: user.id,
      });
      setNotes('');
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
      await loadSlots();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  return (
    <AdminShell
      title="Agenda"
      subtitle="Defina os horários de treino de cada aluno."
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando agenda..." /> : null}

      {!isLoading ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

          <View className="rounded-card border border-line bg-surface p-5 gap-4">
            <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
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
              label="Agendar treino"
              loading={isSaving}
              onPress={() => void handleCreate()}
            />
          </View>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-ink">Horários cadastrados</Text>
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
                  <Pressable className="mt-3" onPress={() => void handleDelete(slot.id)}>
                    <Text className="text-sm text-red-400">Remover</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
