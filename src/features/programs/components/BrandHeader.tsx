import { BrandMark } from '@/shared/components';
import { colors } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getSupabaseSqlEditorUrl } from '@/shared/constants/app';
import { routes } from '@/shared/constants/routes';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function showAdminBlockedAlert(message: string) {
  const sqlUrl = getSupabaseSqlEditorUrl();
  Alert.alert('Não foi possível abrir o admin', message, [
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
  ]);
}

type BrandHeaderProps = {
  showBrand?: boolean;
  title?: string;
  showAdminPill?: boolean;
};

export function BrandHeader({ showBrand = true, title, showAdminPill = true }: BrandHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAdmin, canOpenAdmin, becomeAdmin, isLoading } = useAuth();

  async function handleAdminPress() {
    try {
      if (!isAdmin) {
        Alert.alert(
          'Painel do administrador',
          'Aqui você cadastra programas, aulas, vídeos e libera o acesso dos alunos. Continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Entrar como treinador',
              onPress: () => {
                void (async () => {
                  const promoted = await becomeAdmin();
                  if (!promoted) {
                    showAdminBlockedAlert(
                      useAuthStore.getState().error ??
                        'Você continua na área do aluno. Tente novamente.',
                    );
                    return;
                  }
                  router.push(routes.admin);
                })();
              },
            },
          ],
        );
        return;
      }

      router.push(routes.admin);
    } catch {
      showAdminBlockedAlert('Você continua na área do aluno. Tente novamente.');
    }
  }

  return (
    <View className="bg-background px-5 pb-3" style={{ paddingTop: insets.top + 6 }}>
      <View className="flex-row items-center justify-between">
        {showBrand ? (
          <BrandMark />
        ) : (
          <Text className="text-[28px] font-bold text-ink">{title}</Text>
        )}

        <View className="flex-row items-center gap-2">
          {canOpenAdmin && showAdminPill ? (
            <Pressable
              onPress={() => void handleAdminPress()}
              disabled={isLoading}
              className="rounded-full bg-primary px-3 py-1.5"
              accessibilityRole="button"
              accessibilityLabel="Abrir painel admin"
            >
              <Text className="text-xs font-bold text-white">
                {isAdmin ? 'Admin' : 'Sou admin'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push(routes.profile)}
            className="h-9 w-9 items-center justify-center rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Notificações"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
