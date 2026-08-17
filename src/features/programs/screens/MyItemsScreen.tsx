import { colors } from '@/shared/theme';
import { BrandHeader, ProgramCarousel } from '@/features/programs/components';
import { useCatalog } from '@/features/programs/hooks';
import { OfflineBanner } from '@/features/offline';
import { EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import { RefreshControl, ScrollView, View } from 'react-native';

export function MyItemsScreen() {
  const { catalog, myItems, myItemIds, progressByProgramId, isLoading, isRefreshing, error, refetch } =
    useCatalog();

  const exploreCatalog = catalog.filter((program) => !myItemIds.has(program.id));

  return (
    <View className="flex-1 bg-background">
      <BrandHeader showBrand={false} title="Meus Itens" />
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando seus itens..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12 pt-2"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {myItems.length === 0 ? (
            <View className="px-5">
              <EmptyState
                icon="folder-open-outline"
                title="Nenhum item liberado"
                description="Quando o admin liberar o acesso, seus programas aparecem aqui."
              />
            </View>
          ) : (
            <ProgramCarousel
              title="Treinos"
              subtitle="Treinos de todos os tipos para todos os objetivos"
              programs={myItems}
              progressByProgramId={progressByProgramId}
            />
          )}

          {exploreCatalog.length > 0 ? (
            <ProgramCarousel
              title="Yoga e mais"
              subtitle="Encontre o equilíbrio"
              programs={exploreCatalog}
              progressByProgramId={progressByProgramId}
            />
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}
