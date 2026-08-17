import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { OfflineBanner } from '@/features/offline';
import { NotificationSettingsCard } from '@/features/notifications';
import { Button, Card, LoadingIndicator } from '@/shared/components';
import { APP_BUILD, APP_NAME, APP_VERSION, getSupabaseSqlEditorUrl } from '@/shared/constants/app';
import { routes } from '@/shared/constants/routes';
import { getDisplayPersonName, getNameInitials } from '@/shared/utils/person-name';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, isLoading, isAdmin, canOpenAdmin, becomeAdmin } = useAuth();
  const displayName = getDisplayPersonName(user?.name) ?? 'Aluno';
  const initials = getNameInitials(user?.name);

  async function handleOpenAdmin() {
    try {
      if (!isAdmin) {
        const promoted = await becomeAdmin();
        if (!promoted) {
          const sqlUrl = getSupabaseSqlEditorUrl();
          Alert.alert(
            'Não foi possível abrir o admin',
            useAuthStore.getState().error ??
              'Você continua na área do aluno. Tente novamente.',
            [
              { text: 'OK' },
              ...(sqlUrl
                ? [
                    {
                      text: 'Abrir SQL Editor',
                      onPress: () => {
                        void Linking.openURL(sqlUrl);
                      },
                    },
                  ]
                : []),
            ],
          );
          return;
        }
      }
      router.push(routes.admin);
    } catch {
      Alert.alert(
        'Não foi possível abrir o admin',
        'Você continua na área do aluno. Tente novamente.',
      );
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-[28px] font-bold text-ink">Conta</Text>
      </View>
      <OfflineBanner />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {!user ? (
          <LoadingIndicator message="Carregando perfil..." />
        ) : (
          <Card className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
              <Text className="text-3xl font-semibold text-white">{initials}</Text>
            </View>
            <Text className="mt-4 text-2xl font-semibold text-ink">{displayName}</Text>
            <Text className="mt-1 text-sm text-muted">{user.email}</Text>
            <View className="mt-4 rounded-full bg-surface px-3 py-1">
              <Text className="text-xs capitalize text-muted">
                {isAdmin ? 'Treinadora' : 'Aluno'}
              </Text>
            </View>
            {user.bodyMetrics ? (
              <Text className="mt-3 text-center text-sm text-muted">
                {user.bodyMetrics.weightKg} kg · {user.bodyMetrics.heightCm} cm ·{' '}
                {user.bodyMetrics.age} anos
              </Text>
            ) : null}
          </Card>
        )}

        <Pressable
          onPress={() => router.push('/evolution' as Href)}
          className="min-h-[72px] flex-row items-center rounded-card border border-line bg-surface px-4"
        >
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Ionicons name="trending-up-outline" size={22} color="#E8573A" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">Minha evolução</Text>
            <Text className="mt-0.5 text-sm text-muted">Peso, fotos e histórico físico</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#E8573A" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/messages' as Href)}
          className="min-h-[72px] flex-row items-center rounded-card border border-line bg-surface px-4"
        >
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Ionicons name="chatbubbles-outline" size={22} color="#E8573A" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">Recados da treinadora</Text>
            <Text className="mt-0.5 text-sm text-muted">Tire dúvidas e receba orientações</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#E8573A" />
        </Pressable>

        {canOpenAdmin ? (
          <Pressable
            onPress={() => void handleOpenAdmin()}
            className="min-h-[72px] flex-row items-center rounded-card border border-primary/20 bg-primary/10 px-4 active:opacity-85"
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary">
              <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">Painel do administrador</Text>
              <Text className="mt-0.5 text-sm text-muted">
                {isAdmin
                  ? 'Cadastrar programas, aulas, vídeos e liberar alunos'
                  : 'Toque para entrar e cadastrar treinos'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#E8573A" />
          </Pressable>
        ) : null}

        {user ? <NotificationSettingsCard /> : null}

        <Button
          label="Sair da conta"
          variant="danger"
          onPress={() => void signOut()}
          loading={isLoading}
        />

        <Text className="mt-4 text-center text-xs text-faint">
          {APP_NAME} v{APP_VERSION} ({APP_BUILD})
        </Text>
      </ScrollView>
    </View>
  );
}
