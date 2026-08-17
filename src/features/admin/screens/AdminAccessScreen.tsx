import { colors } from '@/shared/theme';
import { AdminShell } from '@/features/admin/components';
import { useAuth } from '@/features/auth';
import { Button, EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import {
  adminGrantProgramAccess,
  adminListProgramAccessGrants,
  adminRevokeAccessGrant,
  adminSearchStudents,
  DATA_FETCH_TIMEOUT_MS,
  getDataErrorMessage,
  listAdminPrograms,
  withTimeout,
} from '@/services';
import type { AccessGrantWithUser } from '@/services';
import type { ProgramSummary, UserRef } from '@/domain';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export function AdminAccessScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<UserRef[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserRef | null>(null);
  const [grants, setGrants] = useState<AccessGrantWithUser[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await withTimeout(
        listAdminPrograms(),
        DATA_FETCH_TIMEOUT_MS,
        'Os programas demoraram demais para carregar. Tente novamente.',
      );
      setPrograms(data);
      if (data[0]) {
        setSelectedProgramId(data[0].id);
      }
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGrants = useCallback(async () => {
    if (!selectedProgramId) {
      setGrants([]);
      return;
    }

    try {
      const data = await withTimeout(
        adminListProgramAccessGrants(selectedProgramId),
        DATA_FETCH_TIMEOUT_MS,
        'As liberações demoraram demais para carregar. Tente novamente.',
      );
      setGrants(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }, [selectedProgramId]);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  async function handleSearch() {
    if (searchQuery.trim().length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar o aluno.');
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const results = await withTimeout(
        adminSearchStudents(searchQuery),
        DATA_FETCH_TIMEOUT_MS,
        'A busca de alunos demorou demais. Tente novamente.',
      );
      setStudents(results);
      if (results.length === 0) {
        setError(null);
      }
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGrantAccess() {
    if (!user || !selectedStudent || !selectedProgramId) {
      setError('Selecione aluna e programa.');
      return;
    }

    setIsGranting(true);
    setError(null);
    setSuccess(null);

    try {
      await adminGrantProgramAccess({
        userId: selectedStudent.id,
        programId: selectedProgramId,
        grantedBy: user.id,
        grantedAt: new Date().toISOString(),
      });
      setSuccess(`Acesso liberado para ${selectedStudent.name}.`);
      setSelectedStudent(null);
      await loadGrants();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsGranting(false);
    }
  }

  async function handleRevoke(grantId: string) {
    setError(null);
    try {
      await adminRevokeAccessGrant(grantId);
      setSuccess('Acesso removido.');
      await loadGrants();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  return (
    <AdminShell
      title="Liberação de acesso"
      subtitle="Conceda ou remova acesso de alunas aos programas"
      showBack
      onBack={() => router.back()}
    >
      {isLoading ? <LoadingIndicator fullScreen message="Carregando..." /> : null}

      {!isLoading && error && programs.length === 0 ? (
        <View className="px-5 pt-4">
          <ErrorState message={error} onRetry={() => void loadPrograms()} />
        </View>
      ) : null}

      {!isLoading && !error && programs.length === 0 ? (
        <View className="px-5 pt-4">
          <EmptyState
            title="Nenhum programa cadastrado"
            description="Crie e publique um programa antes de liberar o acesso dos alunos."
          />
        </View>
      ) : null}

      {!isLoading && programs.length > 0 ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 py-4 pb-10">
          <View>
            <Text className="mb-2 text-sm text-muted">Programa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {programs.map((program) => (
                  <Pressable
                    key={program.id}
                    onPress={() => setSelectedProgramId(program.id)}
                    className={`rounded-full px-3 py-2 ${
                      selectedProgramId === program.id ? 'bg-primary' : 'bg-elevated'
                    }`}
                  >
                    <Text
                      className={
                        selectedProgramId === program.id
                          ? 'font-semibold text-background'
                          : 'text-muted'
                      }
                    >
                      {program.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="rounded-card border border-line bg-surface p-5">
            <Text className="font-semibold text-ink">Buscar aluna</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Nome ou e-mail"
              placeholderTextColor="#9B9B9B"
              className="mt-3 rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
            />
            <Pressable
              disabled={isSearching}
              onPress={() => void handleSearch()}
              className="mt-3 min-h-[48px] items-center justify-center rounded-2xl border border-primary/40"
            >
              {isSearching ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text className="font-semibold text-primary">Buscar</Text>
              )}
            </Pressable>

            <View className="mt-3 gap-2">
              {searchQuery.trim().length >= 2 && students.length === 0 && !isSearching ? (
                <Text className="text-sm text-muted">Nenhum aluno encontrado para essa busca.</Text>
              ) : null}
              {students.map((student) => (
                <Pressable
                  key={student.id}
                  onPress={() => setSelectedStudent(student)}
                  className={`rounded-2xl border px-3 py-3 ${
                    selectedStudent?.id === student.id
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-line'
                  }`}
                >
                  <Text className="font-medium text-ink">{student.name}</Text>
                  <Text className="text-xs text-muted">{student.email}</Text>
                </Pressable>
              ))}
            </View>

            <Button
              className="mt-4"
              disabled={!selectedStudent || isGranting}
              loading={isGranting}
              onPress={() => void handleGrantAccess()}
              label="Liberar acesso"
            />
          </View>

          <View>
            <Text className="mb-3 text-lg font-semibold text-ink">
              Alunas com acesso a este programa
            </Text>
            {grants.length === 0 ? (
              <Text className="text-muted">Nenhuma liberação registrada.</Text>
            ) : (
              grants.map((grant) => (
                <View
                  key={grant.id}
                  className="mb-3 flex-row items-center rounded-card border border-line bg-surface p-5"
                >
                  <View className="flex-1">
                    <Text className="font-medium text-ink">{grant.user.name}</Text>
                    <Text className="text-xs text-muted">{grant.user.email}</Text>
                    <Text className="mt-1 text-xs text-faint">
                      Liberado em {new Date(grant.grantedAt).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <Pressable onPress={() => void handleRevoke(grant.id)}>
                    <Text className="text-sm text-red-400">Remover</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          {success ? <Text className="text-sm text-primary">{success}</Text> : null}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
