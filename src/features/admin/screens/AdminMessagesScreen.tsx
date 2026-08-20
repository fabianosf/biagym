import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { MessagesThread } from '@/features/coaching';
import type { StudentProfile } from '@/domain/student';
import { listBodyLogs } from '@/services';
import type { BodyLog } from '@/domain/student';
import { AppImage } from '@/shared/components';
import { useT } from '@/shared/theme';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function AdminMessagesScreen() {
  const t = useT();
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

    let cancelled = false;

    void listBodyLogs(activeStudent.userId)
      .then((data) => {
        if (!cancelled) {
          setLogs(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogs([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeStudent]);

  return (
    <AdminShell
      title={firstName ? t('admin.messages.titleFor', { name: firstName }) : t('messages.title')}
      subtitle={
        activeStudent
          ? t('admin.messages.subtitleFor', { name: activeStudent.name })
          : t('admin.messages.subtitleGeneric')
      }
      showBack
      onBack={goBackToStudent}
    >
      <View className="px-5 pb-4">
        {focusedStudentId ? (
          <Text className="text-sm text-muted">
            {t('admin.schedule.individualFor', {
              name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
            })}
          </Text>
        ) : (
          <AdminStudentSearch selected={selectedStudent} onSelect={setSelectedStudent} />
        )}
        {activeStudent?.metrics ? (
          <Text className="mt-3 text-sm text-muted">
            {t('profile.metrics', {
              weight: String(activeStudent.metrics.weightKg),
              height: String(activeStudent.metrics.heightCm),
              age: String(activeStudent.metrics.age),
            })}
          </Text>
        ) : null}
        {logs[0] ? (
          <View className="mt-3">
            <Text className="text-xs uppercase tracking-[1.4px] text-muted">
              {t('admin.messages.lastRecord')}
            </Text>
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
        <Text className="px-5 text-muted">{t('admin.messages.selectStudent')}</Text>
      )}
    </AdminShell>
  );
}
