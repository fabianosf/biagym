import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { MessagesThread } from '@/features/coaching';
import type { StudentProfile } from '@/domain/student';
import { listBodyLogs } from '@/services';
import type { BodyLog } from '@/domain/student';
import { AppImage } from '@/shared/components';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function AdminMessagesScreen() {
  const { focusedStudentId, student: focusedStudent, goBackToStudent } = useAdminFocusedStudent();
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [logs, setLogs] = useState<BodyLog[]>([]);

  useEffect(() => {
    if (focusedStudent) {
      setSelectedStudent(focusedStudent);
    }
  }, [focusedStudent]);

  const activeStudent = focusedStudent ?? selectedStudent;
  const firstName = activeStudent ? getStudentFirstName(activeStudent.name) : null;

  useEffect(() => {
    if (!activeStudent) {
      setLogs([]);
      return;
    }

    void listBodyLogs(activeStudent.userId)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [activeStudent]);

  return (
    <AdminShell
      title={firstName ? `Recados de ${firstName}` : 'Recados'}
      subtitle={
        activeStudent
          ? `Dicas e orientação só para ${activeStudent.name}.`
          : 'Escolha um aluno para mandar um recado.'
      }
      showBack
      onBack={goBackToStudent}
    >
      <View className="px-5 pb-4">
        {focusedStudentId ? (
          <Text className="text-sm text-muted">Individual: {focusedStudent?.name ?? 'este aluno'}</Text>
        ) : (
          <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
        )}
        {activeStudent?.metrics ? (
          <Text className="mt-3 text-sm text-muted">
            {activeStudent.metrics.weightKg} kg · {activeStudent.metrics.heightCm} cm ·{' '}
            {activeStudent.metrics.age} anos
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
      {activeStudent ? (
        <MessagesThread studentUserId={activeStudent.userId} />
      ) : (
        <Text className="px-5 text-muted">Selecione um aluno para enviar um recado.</Text>
      )}
    </AdminShell>
  );
}
