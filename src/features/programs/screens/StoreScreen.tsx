import { colors } from '@/shared/theme';
import { ProgramPosterCard } from '@/features/programs/components';
import { BrandHeader } from '@/features/programs/components/BrandHeader';
import { useCatalog } from '@/features/programs/hooks';
import { OfflineBanner } from '@/features/offline';
import { EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

export function StoreScreen() {
  const { catalog, progressByProgramId, isLoading, isRefreshing, error, refetch } = useCatalog();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'programas' | 'lista'>('programas');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return catalog;
    }

    return catalog.filter((program) => {
      return (
        program.title.toLowerCase().includes(normalized) ||
        program.trainerName.toLowerCase().includes(normalized)
      );
    });
  }, [catalog, query]);

  const list = tab === 'lista' ? filtered.filter((program) => program.id) : filtered;

  return (
    <View className="flex-1 bg-background">
      <BrandHeader showBrand={false} title="Loja" />
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando catálogo..." /> : null}

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
              placeholder="Pesquise aqui"
              placeholderTextColor="#9B9B9B"
              className="flex-1 px-3 py-3 text-base text-ink"
            />
          </View>

          <View className="mb-4 flex-row gap-5 border-b border-line">
            {(
              [
                ['programas', 'Programas'],
                ['lista', 'Minha lista'],
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mb-5 gap-2"
          >
            {['Todos', 'Objetivo', 'Modalidades', 'Intensidade'].map((chip, index) => (
              <View
                key={chip}
                className={`flex-row items-center rounded-xl border px-3 py-2 ${
                  index === 0 ? 'border-ink' : 'border-line'
                }`}
              >
                {index === 0 ? (
                  <Ionicons name="checkmark" size={14} color="#1A1A1A" />
                ) : (
                  <Ionicons name="chevron-down" size={14} color="#6F6F6F" />
                )}
                <Text className="ml-1 text-sm text-ink">{chip}</Text>
              </View>
            ))}
          </ScrollView>

          {list.length === 0 ? (
            <EmptyState
              title="Nenhum programa por aqui"
              description="Quando a treinadora publicar programas, eles aparecem nesta loja. Seus Treinos A, B e C ficam na aba Treinos."
            />
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {list.map((program) => (
                <View key={program.id} className="mb-4 w-[48%]">
                  <View className="w-full">
                    <ProgramPosterCard
                      program={program}
                      progress={progressByProgramId[program.id] ?? null}
                      size="grid"
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
