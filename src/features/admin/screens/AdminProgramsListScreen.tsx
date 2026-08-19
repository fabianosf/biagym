import { useThemeColors } from '@/shared/theme';
import { AdminShell } from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { ErrorState, LoadingIndicator } from '@/shared/components';
import { adminDeleteProgram, DATA_FETCH_TIMEOUT_MS, listAdminPrograms, withTimeout } from '@/services';
import { getDataErrorMessage } from '@/services';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import type { ProgramSummary } from '@/domain';

export function AdminProgramsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await withTimeout(
        listAdminPrograms(),
        DATA_FETCH_TIMEOUT_MS,
        'Os programas demoraram demais para carregar. Tente de novo.',
      );
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

  useFocusEffect(
    useCallback(() => {
      void load(hasLoadedRef.current);
      hasLoadedRef.current = true;
    }, [load]),
  );

  async function handleDelete(program: ProgramSummary) {
    setDeletingId(program.id);
    setError(null);
    try {
      await withTimeout(
        adminDeleteProgram(program.id),
        DATA_FETCH_TIMEOUT_MS,
        'Não foi possível excluir o programa agora. Tente de novo.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(program: ProgramSummary) {
    Alert.alert(
      'Excluir programa',
      `"${program.title}" e todas as semanas, aulas e vídeos serão removidos. Alunos que tinham acesso perdem o programa. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => void handleDelete(program) },
      ],
    );
  }

  return (
    <AdminShell
      title="Programas de Treino"
      subtitle="Publicados e rascunhos"
      showBack={router.canGoBack()}
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
          contentContainerClassName="gap-4 px-5 py-4 pb-28"
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
              <View key={program.id} className="rounded-card border border-line bg-surface p-5">
                <View className="flex-row items-start gap-3">
                  <Link href={adminRoutes.programDetail(program.id)} asChild>
                    <Pressable className="min-w-0 flex-1 active:opacity-80">
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
                </View>

                <View className="mt-4 flex-row gap-3 border-t border-line pt-3">
                  <Link href={adminRoutes.programEdit(program.id)} asChild>
                    <Pressable className="flex-1 items-center rounded-xl bg-elevated py-2.5">
                      <Text className="text-sm font-semibold text-ink">Editar</Text>
                    </Pressable>
                  </Link>
                  <Pressable
                    onPress={() => confirmDelete(program)}
                    disabled={deletingId === program.id}
                    className="flex-1 items-center rounded-xl bg-red-500/10 py-2.5"
                  >
                    <Text className="text-sm font-semibold text-red-500">
                      {deletingId === program.id ? 'Excluindo...' : 'Excluir'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
