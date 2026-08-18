import {
  AdminNavCard,
  AdminShell,
  AdminStudentRoster,
} from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT } from '@/shared/theme';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdminHomeScreen() {
  const t = useT();
  const router = useRouter();
  const [showCatalog, setShowCatalog] = useState(false);

  return (
    <AdminShell
      title="Painel da treinadora"
      subtitle="Toque no aluno. Tudo que você fizer a partir daqui é só dele."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5">
          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentsTitle')}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            {t('admin.studentsHint')}
          </Text>
        </View>

        <AdminStudentRoster />

        <View className="gap-3 px-5 pt-2">
          <AdminNavCard
            title="Loja"
            description="Cadastrar, editar e remover produtos e cupons para as alunas"
            href={adminRoutes.store as Href}
            icon="storefront-outline"
          />
        </View>

        <View className="px-5 pt-2">
          <Pressable
            onPress={() => setShowCatalog((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel="Mostrar catálogo da academia"
          >
            <Text className="text-sm font-semibold text-primary">
              {showCatalog ? 'Ocultar catálogo da academia' : 'Catálogo da academia'}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-faint">
              Fichas, exercícios e programas da casa. Para enviar, volte no aluno.
            </Text>
          </Pressable>
        </View>

        {showCatalog ? (
          <View className="gap-3 px-5">
            <AdminNavCard
              title="Fichas A / B / C"
              description="Montar o modelo. Publicar é no espaço do aluno."
              href={adminRoutes.workouts as Href}
              icon="barbell-outline"
            />
            <AdminNavCard
              title="Exercícios e vídeos"
              description="Catálogo da academia, para usar nas fichas"
              href={adminRoutes.exercises as Href}
              icon="videocam-outline"
            />
            <AdminNavCard
              title="Programas e aulas"
              description="Séries e semanas da casa"
              href={adminRoutes.programs}
              icon="play-circle-outline"
            />
          </View>
        ) : null}

        {showCatalog ? (
          <Text className="px-5 text-xs leading-4 text-faint">
            Para liberar ficha ou programa pra uma aluna, entre no espaço dela na lista acima.
          </Text>
        ) : null}
      </ScrollView>
    </AdminShell>
  );
}
