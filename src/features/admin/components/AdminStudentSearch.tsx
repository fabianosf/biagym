import { colors } from '@/shared/theme';
import type { StudentProfile } from '@/domain/student';
import { DATA_FETCH_TIMEOUT_MS, listStudentProfiles, searchStudentProfiles, withTimeout } from '@/services';
import { getDataErrorMessage } from '@/services';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

type AdminStudentSearchProps = {
  selected: StudentProfile | null;
  onSelect: (student: StudentProfile) => void;
  allowEmptySelection?: boolean;
  onClear?: () => void;
};

export function AdminStudentSearch({
  selected,
  onSelect,
  allowEmptySelection = false,
  onClear,
}: AdminStudentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDefault = useCallback(async () => {
    setError(null);
    try {
      const students = await withTimeout(
        listStudentProfiles({ limit: 12 }),
        DATA_FETCH_TIMEOUT_MS,
        'A busca de alunos demorou demais. Tente novamente.',
      );
      setResults(students);
    } catch (err) {
      setResults([]);
      setError(getDataErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void loadDefault();
  }, [loadDefault]);

  async function handleSearch() {
    setIsSearching(true);
    setHasSearched(true);
    setError(null);
    try {
      const students = await withTimeout(
        query.trim().length < 2
          ? listStudentProfiles({ limit: 12 })
          : searchStudentProfiles(query),
        DATA_FETCH_TIMEOUT_MS,
        'A busca de alunos demorou demais. Tente novamente.',
      );
      setResults(students);
    } catch (err) {
      setResults([]);
      setError(getDataErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <View>
      <Text className="mb-2 text-sm font-medium text-muted">Aluno</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Nome ou e-mail"
        placeholderTextColor="#9B9B9B"
        className="rounded-2xl border border-line bg-elevated px-4 py-3.5 text-ink"
        onSubmitEditing={() => void handleSearch()}
      />
      <Pressable
        onPress={() => void handleSearch()}
        disabled={isSearching}
        className="mt-2 min-h-[44px] items-center justify-center rounded-2xl border border-primary/40"
      >
        {isSearching ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text className="font-semibold text-primary">Buscar aluno</Text>
        )}
      </Pressable>

      {error ? <Text className="mt-2 text-sm text-red-400">{error}</Text> : null}

      {allowEmptySelection ? (
        <Pressable
          onPress={onClear}
          className={`mt-2 rounded-2xl border px-3 py-3 ${
            selected === null ? 'border-primary/40 bg-primary/10' : 'border-line'
          }`}
        >
          <Text className="font-medium text-ink">Plano geral (todos os alunos)</Text>
        </Pressable>
      ) : null}

      <View className="mt-2 gap-2">
        {!error && !isSearching && results.length === 0 ? (
          <Text className="text-sm text-muted">
            {hasSearched
              ? 'Nenhum aluno encontrado. Cadastre o aluno ou busque por outro nome/e-mail.'
              : 'Nenhum aluno listado ainda.'}
          </Text>
        ) : null}

        {results.map((student) => (
          <Pressable
            key={student.userId}
            onPress={() => onSelect(student)}
            className={`rounded-2xl border px-3 py-3 ${
              selected?.userId === student.userId
                ? 'border-primary/40 bg-primary/10'
                : 'border-line'
            }`}
          >
            <Text className="font-medium text-ink">{student.name}</Text>
            <Text className="text-xs text-muted">{student.email}</Text>
            {student.metrics ? (
              <Text className="mt-1 text-xs text-faint">
                {student.metrics.weightKg} kg · {student.metrics.heightCm} cm ·{' '}
                {student.metrics.age} anos
              </Text>
            ) : (
              <Text className="mt-1 text-xs text-faint">Onboarding pendente</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
