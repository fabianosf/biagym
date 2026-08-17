import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { MessagesThread } from '@/features/coaching';
import type { StudentProfile } from '@/domain/student';
import { listBodyLogs } from '@/services';
import type { BodyLog } from '@/domain/student';
import { AppImage } from '@/shared/components';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function AdminMessagesScreen() {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [logs, setLogs] = useState<BodyLog[]>([]);

  useEffect(() => {
    if (!selectedStudent) {
      setLogs([]);
      return;
    }

    void listBodyLogs(selectedStudent.userId)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [selectedStudent]);

  return (
    <AdminShell
      title="Recados"
      subtitle="Fale com o aluno e acompanhe a evolução física."
      showBack
      onBack={() => router.back()}
    >
      <View className="px-5 pb-4">
        <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
        {selectedStudent?.metrics ? (
          <Text className="mt-3 text-sm text-muted">
            {selectedStudent.metrics.weightKg} kg · {selectedStudent.metrics.heightCm} cm ·{' '}
            {selectedStudent.metrics.age} anos
          </Text>
        ) : null}
        {logs[0] ? (
          <View className="mt-3">
            <Text className="text-xs uppercase tracking-[1.4px] text-muted">Último registro</Text>
            <Text className="mt-1 font-semibold text-ink">{logs[0].weightKg} kg</Text>
            {logs[0].photoUrl ? (
              <AppImage className="mt-3 rounded-2xl" uri={logs[0].photoUrl} aspectRatio={3 / 4} />
            ) : null}
          </View>
        ) : null}
      </View>
      {selectedStudent ? (
        <MessagesThread studentUserId={selectedStudent.userId} />
      ) : (
        <Text className="px-5 text-muted">Selecione um aluno para enviar um recado.</Text>
      )}
    </AdminShell>
  );
}
