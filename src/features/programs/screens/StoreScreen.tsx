import { PROGRAM_LEVELS, type ProgramLevel } from '@/domain/program';
import { colors, useT } from '@/shared/theme';
import { ProgramPosterCard } from '@/features/programs/components';
import { BrandHeader } from '@/features/programs/components/BrandHeader';
import { useCatalog } from '@/features/programs/hooks';
import { OfflineBanner } from '@/features/offline';
import { EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

export function StoreScreen() {
  const t = useT();
  const { catalog, myItemIds, progressByProgramId, isLoading, isRefreshing, error, refetch } =
    useCatalog();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'programas' | 'lista'>('programas');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId ?? null);
  const [level, setLevel] = useState<ProgramLevel | null>(null);

  const categories = useMemo(() => {
    const byId = new Map<string, string>();
    for (const program of catalog) {
      for (const category of program.categories) {
        byId.set(category.id, category.name);
      }
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [catalog]);

  const levels = useMemo(() => {
    const present = new Set(catalog.map((program) => program.level));
    return PROGRAM_LEVELS.filter((item) => present.has(item));
  }, [catalog]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return catalog.filter((program) => {
      if (normalized) {
        const matchesQuery =
          program.title.toLowerCase().includes(normalized) ||
          program.trainerName.toLowerCase().includes(normalized);
        if (!matchesQuery) {
          return false;
        }
      }

      if (categoryId && !program.categories.some((category) => category.id === categoryId)) {
        return false;
      }

      if (level && program.level !== level) {
        return false;
      }

      return true;
    });
  }, [catalog, query, categoryId, level]);

  const list = tab === 'lista' ? filtered.filter((program) => myItemIds.has(program.id)) : filtered;
  const hasActiveFilters = Boolean(categoryId || level || query.trim());

  return (
    <View className="flex-1 bg-background">
      <BrandHeader showBrand={false} title={t('store.title')} showAdminPill={false} />
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message={t('store.loadingCatalog')} /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-4 flex-row items-center rounded-full bg-surface px-4">
            <Ionicons name="search-outline" size={18} color="#9B9B9B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('store.searchPlaceholder')}
              placeholderTextColor="#9B9B9B"
              className="flex-1 px-3 py-3 text-base text-ink"
            />
          </View>

          <View className="mb-4 flex-row gap-5 border-b border-line">
            {(
              [
                ['programas', t('store.tabPrograms')],
                ['lista', t('store.tabMyList')],
              ] as const
            ).map(([id, label]) => (
              <Pressable key={id} onPress={() => setTab(id)} className="pb-2">
                <Text
                  className={`text-base ${
                    tab === id ? 'font-semibold text-primary' : 'text-muted'
                  }`}
                >
                  {label}
                </Text>
                {tab === id ? <View className="mt-2 h-[3px] rounded-full bg-primary" /> : null}
              </Pressable>
            ))}
          </View>

          {categories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="mb-2 gap-2"
            >
              <Pressable
                onPress={() => setCategoryId(null)}
                className={`flex-row items-center rounded-xl border px-3 py-2 ${
                  categoryId === null ? 'border-ink' : 'border-line'
                }`}
              >
                {categoryId === null ? (
                  <Ionicons name="checkmark" size={14} color="#1A1A1A" />
                ) : null}
                <Text className={`text-sm text-ink ${categoryId === null ? 'ml-1' : ''}`}>
                  {t('store.allCategories')}
                </Text>
              </Pressable>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    setCategoryId((current) => (current === category.id ? null : category.id))
                  }
                  className={`flex-row items-center rounded-xl border px-3 py-2 ${
                    categoryId === category.id ? 'border-ink' : 'border-line'
                  }`}
                >
                  {categoryId === category.id ? (
                    <Ionicons name="checkmark" size={14} color="#1A1A1A" />
                  ) : null}
                  <Text className={`text-sm text-ink ${categoryId === category.id ? 'ml-1' : ''}`}>
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {levels.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="mb-5 gap-2"
            >
              <Pressable
                onPress={() => setLevel(null)}
                className={`rounded-xl border px-3 py-2 ${level === null ? 'border-ink' : 'border-line'}`}
              >
                <Text className="text-sm text-ink">{t('store.allLevels')}</Text>
              </Pressable>
              {levels.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setLevel((current) => (current === item ? null : item))}
                  className={`rounded-xl border px-3 py-2 ${level === item ? 'border-ink' : 'border-line'}`}
                >
                  <Text className="text-sm text-ink">{t(`programLevels.${item}`)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View className="mb-1" />
          )}

          {list.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? t('store.emptyFilteredTitle') : t('store.emptyTitle')}
              description={
                hasActiveFilters ? t('store.emptyFilteredDescription') : t('store.emptyDescription')
              }
            />
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {list.map((program, index) => (
                <View key={program.id} className="mb-4 w-[48%]">
                  <View className="w-full">
                    <ProgramPosterCard
                      program={program}
                      progress={progressByProgramId[program.id] ?? null}
                      size="grid"
                      index={index}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
