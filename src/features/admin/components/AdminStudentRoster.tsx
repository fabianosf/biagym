import { useAuth } from '@/features/auth';
import { AdminStudentAvatar } from '@/features/admin/components/AdminStudentAvatar';
import { getTrainerPins, useStudentPinsStore } from '@/features/admin/store/student-pins.store';
import { STUDENT_GOAL_LABELS, type StudentProfile } from '@/domain/student';
import { getDataErrorMessage, listStudentProfiles } from '@/services';
import { ErrorState, LoadingIndicator } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT, useThemeColors } from '@/shared/theme';
import { digitsOnly, formatPhoneDisplay } from '@/shared/utils/phone';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

function matchesQuery(student: StudentProfile, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (student.name.toLowerCase().includes(normalized) || student.email.toLowerCase().includes(normalized)) {
    return true;
  }

  const digits = digitsOnly(normalized);
  return digits.length >= 3 && digitsOnly(student.phone ?? '').includes(digits);
}

export function AdminStudentRoster() {
  const router = useRouter();
  const t = useT();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pinsMap = useStudentPinsStore((state) => state.byTrainerId);
  const toggleFavorite = useStudentPinsStore((state) => state.toggleFavorite);
  const pins = getTrainerPins(pinsMap, user?.id);

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

  useFocusEffect(
    useCallback(() => {
      void loadStudents();
    }, [loadStudents]),
  );

  const filtered = useMemo(() => {
    const matched = students.filter((student) => matchesQuery(student, query));
    return [...matched].sort((left, right) => {
      const favLeft = pins.favoriteIds.includes(left.userId);
      const favRight = pins.favoriteIds.includes(right.userId);
      if (favLeft !== favRight) {
        return favLeft ? -1 : 1;
      }

      const openedLeft = pins.lastOpenedAt[left.userId] ?? 0;
      const openedRight = pins.lastOpenedAt[right.userId] ?? 0;
      if (openedLeft !== openedRight) {
        return openedRight - openedLeft;
      }

      return left.name.localeCompare(right.name, 'pt-BR');
    });
  }, [pins.favoriteIds, pins.lastOpenedAt, query, students]);

  const favorites = filtered.filter((student) => pins.favoriteIds.includes(student.userId));
  const others = filtered.filter((student) => !pins.favoriteIds.includes(student.userId));
  const grouped = query.trim().length > 0 || favorites.length === 0;

  if (isLoading) {
    return (
      <View className="px-5 py-6">
        <LoadingIndicator message="Carregando alunos..." />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 px-5">
        <ErrorState message={error} onRetry={() => void loadStudents()} />
      </View>
    );
  }

  return (
    <View className="gap-3 px-5">
      <View className="flex-row items-center rounded-2xl border border-line bg-elevated px-3.5">
        <Ionicons name="search-outline" size={18} color={colors.faint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('admin.searchPlaceholder')}
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          className="flex-1 px-3 py-3.5 text-base text-ink"
        />
      </View>

      {students.length === 0 ? (
        <Text className="text-sm leading-5 text-muted">{t('admin.noStudents')}</Text>
      ) : null}

      {students.length > 0 && filtered.length === 0 ? (
        <Text className="text-sm leading-5 text-muted">{t('admin.noResults')}</Text>
      ) : null}

      {grouped
        ? filtered.map((student) => (
            <StudentRow
              key={student.userId}
              student={student}
              isFavorite={pins.favoriteIds.includes(student.userId)}
              onOpen={() => router.push(adminRoutes.studentSpace(student.userId) as Href)}
              onToggleFavorite={() => {
                if (user) {
                  toggleFavorite(user.id, student.userId);
                }
              }}
            />
          ))
        : (
          <>
            {favorites.length > 0 ? (
              <Text className="mt-1 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
                {t('admin.favorites')}
              </Text>
            ) : null}
            {favorites.map((student) => (
              <StudentRow
                key={student.userId}
                student={student}
                isFavorite
                onOpen={() => router.push(adminRoutes.studentSpace(student.userId) as Href)}
                onToggleFavorite={() => {
                  if (user) {
                    toggleFavorite(user.id, student.userId);
                  }
                }}
              />
            ))}
            {others.length > 0 ? (
              <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
                {t('admin.others')}
              </Text>
            ) : null}
            {others.map((student) => (
              <StudentRow
                key={student.userId}
                student={student}
                isFavorite={false}
                onOpen={() => router.push(adminRoutes.studentSpace(student.userId) as Href)}
                onToggleFavorite={() => {
                  if (user) {
                    toggleFavorite(user.id, student.userId);
                  }
                }}
              />
            ))}
          </>
        )}
    </View>
  );
}

type StudentRowProps = {
  student: StudentProfile;
  isFavorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
};

function StudentRow({ student, isFavorite, onOpen, onToggleFavorite }: StudentRowProps) {
  const t = useT();
  const colors = useThemeColors();

  return (
    <View
      className={`flex-row items-center rounded-card border p-4 ${
        isFavorite ? 'border-primary/40 bg-primary/10' : 'border-line bg-surface'
      }`}
    >
      <Pressable
        onPress={onOpen}
        className="min-w-0 flex-1 flex-row items-center"
        accessibilityRole="button"
        accessibilityLabel={`Abrir espaço de ${student.name}`}
      >
        <AdminStudentAvatar student={student} size={48} />
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink">{student.name}</Text>
          <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
            {student.email}
          </Text>
          {student.phone ? (
            <Text className="mt-0.5 text-sm text-muted">{formatPhoneDisplay(student.phone)}</Text>
          ) : null}
          {student.metrics ? (
            <View className="mt-2 flex-row flex-wrap gap-2">
              <MetricChip label={`${student.metrics.weightKg} kg`} />
              <MetricChip label={`${student.metrics.heightCm} cm`} />
              <MetricChip label={STUDENT_GOAL_LABELS[student.metrics.goal]} />
            </View>
          ) : (
            <Text className="mt-2 text-sm text-faint">Onboarding físico pendente</Text>
          )}
        </View>
      </Pressable>
      <Pressable
        onPress={onToggleFavorite}
        hitSlop={8}
        className="ml-2 h-11 w-11 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t('admin.unfavorite') : t('admin.favorite')}
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={22}
          color={isFavorite ? colors.primary : colors.faint}
        />
      </Pressable>
    </View>
  );
}

function MetricChip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-primary/10 px-3 py-1">
      <Text className="text-xs font-semibold text-primary">{label}</Text>
    </View>
  );
}
