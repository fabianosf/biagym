import { colors } from '@/shared/theme';
import { AdminShell } from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { ErrorState, LoadingIndicator } from '@/shared/components';
import { listAdminPrograms } from '@/services';
import { getDataErrorMessage } from '@/services';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import type { ProgramSummary } from '@/domain';

export function AdminProgramsListScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await listAdminPrograms();
      setPrograms(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell
      title="Programas"
      subtitle="Publicados e rascunhos"
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando programas..." /> : null}

      {!isLoading && error ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 py-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
        >
          <Link href={adminRoutes.programNew} asChild>
            <Pressable className="min-h-[52px] items-center justify-center rounded-2xl bg-primary active:opacity-85">
              <Text className="font-semibold text-background">+ Novo programa</Text>
            </Pressable>
          </Link>

          {programs.length === 0 ? (
            <Text className="text-center text-muted">Nenhum programa cadastrado.</Text>
          ) : (
              programs.map((program) => (
              <Link key={program.id} href={adminRoutes.programDetail(program.id)} asChild>
                <Pressable className="rounded-card border border-line bg-surface p-5 active:opacity-90">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="flex-1 text-lg font-semibold text-ink">{program.title}</Text>
                    <View
                      className={`rounded-full px-2 py-1 ${
                        program.isPublished ? 'bg-primary/20' : 'bg-elevated'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          program.isPublished ? 'text-primary' : 'text-muted'
                        }`}
                      >
                        {program.isPublished ? 'Publicado' : 'Rascunho'}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-1 text-sm text-muted">{program.trainerName}</Text>
                  <Text className="mt-2 text-xs text-faint">
                    {program.totalLessons} aulas · {program.durationWeeks} semanas
                  </Text>
                </Pressable>
              </Link>
            ))
          )}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
