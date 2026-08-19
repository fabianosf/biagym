import { useAuth } from '@/features/auth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getSupabaseSqlEditorUrl } from '@/shared/constants/app';
import { routes } from '@/shared/constants/routes';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

/** Tenta entrar no painel admin, promovendo a conta se necessário. Mesmo fluxo usado no card de Conta e na aba do painel. */
export function useAdminEntry() {
  const router = useRouter();
  const { isAdmin, becomeAdmin } = useAuth();

  return useCallback(async () => {
    try {
      if (!isAdmin) {
        const promoted = await becomeAdmin();
        if (!promoted) {
          const sqlUrl = getSupabaseSqlEditorUrl();
          Alert.alert(
            'Não foi possível abrir o admin',
            useAuthStore.getState().error ?? 'Você continua na área do aluno. Tente novamente.',
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
  }, [isAdmin, becomeAdmin, router]);
}
