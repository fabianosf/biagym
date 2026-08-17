import { colors } from '@/shared/theme';
import { ProgramCard } from '@/features/programs/components';
import { useCatalog } from '@/features/programs/hooks';
import { OfflineBanner } from '@/features/offline';
import {
  EmptyState,
  ErrorState,
  LoadingIndicator,
  ScreenHeader,
  SectionHeader,
} from '@/shared/components';
import { useAuth } from '@/features/auth';
import { formatHelloGreeting } from '@/shared/utils/person-name';
import { RefreshControl, ScrollView, View } from 'react-native';

export function ProgramListScreen() {
  const { user } = useAuth();
  const {
    catalog,
    myItems,
    myItemIds,
    progressByProgramId,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useCatalog();

  const exploreCatalog = catalog.filter((program) => !myItemIds.has(program.id));

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        eyebrow="BiAGym"
        title={formatHelloGreeting(user?.name)}
        subtitle="Seus treinos e o catálogo pronto para o próximo ciclo."
      />
      <OfflineBanner />

      {isLoading ? <LoadingIndicator fullScreen message="Carregando programas..." /> : null}

      {!isLoading && error ? (
        <View className="flex-1 px-5 pt-2">
          <ErrorState message={error} onRetry={() => void refetch()} />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-9 px-5 pb-12"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View>
            <SectionHeader
              eyebrow="Biblioteca"
              title="Meus itens"
              subtitle="Programas liberados para você treinar agora"
            />
            {myItems.length === 0 ? (
              <EmptyState
                icon="barbell-outline"
                title="Nenhum programa liberado"
                description="Quando o admin liberar o acesso, seus treinos aparecem aqui com destaque."
              />
            ) : (
              <View className="gap-4">
                {myItems.map((program, index) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    variant="owned"
                    hasAccess
                    progress={progressByProgramId[program.id] ?? null}
                    index={index}
                  />
                ))}
              </View>
            )}
          </View>

          <View>
            <SectionHeader
              title="Explorar catálogo"
              subtitle="Programas publicados que você ainda não possui"
            />
            {exploreCatalog.length === 0 ? (
              <EmptyState
                title="Nada novo para explorar"
                description="Você já tem acesso a todos os programas publicados ou o catálogo está vazio."
              />
            ) : (
              <View className="gap-4">
                {exploreCatalog.map((program, index) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    variant="catalog"
                    progress={progressByProgramId[program.id] ?? null}
                    index={index}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}
