import { AdminShell } from '@/features/admin/components';
import { STUDENT_GOAL_LABELS, type StudentProfile } from '@/domain/student';
import { getDataErrorMessage, listStudentProfiles } from '@/services';
import { ErrorState, LoadingIndicator } from '@/shared/components';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export function AdminStudentsScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setError(null);
    try {
      const data = await listStudentProfiles();
      setStudents(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  return (
    <AdminShell
      title="Alunos"
      subtitle="Acompanhe peso, altura, idade e objetivo de cada aluno."
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando alunos..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5">
          <ErrorState message={error} onRetry={() => void loadStudents()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-12">
          {students.length === 0 ? (
            <Text className="text-muted">Nenhum aluno cadastrado ainda.</Text>
          ) : (
            students.map((student) => (
              <View key={student.userId} className="rounded-card border border-line bg-surface p-5">
                <Text className="text-base font-semibold text-ink">{student.name}</Text>
                <Text className="mt-0.5 text-sm text-muted">{student.email}</Text>
                {student.metrics ? (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    <MetricChip label={`${student.metrics.weightKg} kg`} />
                    <MetricChip label={`${student.metrics.heightCm} cm`} />
                    <MetricChip label={`${student.metrics.age} anos`} />
                    <MetricChip label={STUDENT_GOAL_LABELS[student.metrics.goal]} />
                  </View>
                ) : (
                  <Text className="mt-3 text-sm text-faint">
                    Ainda não preencheu o onboarding físico.
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}

function MetricChip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-primary/10 px-3 py-1">
      <Text className="text-xs font-semibold text-primary">{label}</Text>
    </View>
  );
}
