import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth';
import { routes } from '@/shared/constants/routes';
import { useThemeColors } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AdminShellProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: ReactNode;
};

export function AdminShell({
  title,
  subtitle,
  showBack = false,
  onBack,
  children,
}: AdminShellProps) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const colors = useThemeColors();

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-5" style={{ paddingTop: insets.top + 10 }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Link href={routes.admin} asChild>
            <Pressable className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
              <Text className="text-xs font-semibold text-primary">Admin</Text>
            </Pressable>
          </Link>
          <Pressable
            onPress={() => void signOut()}
            className="rounded-full border border-line bg-elevated px-3 py-1.5"
          >
            <Text className="text-xs text-muted">Sair</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center">
          {showBack ? (
            <Pressable
              onPress={onBack}
              className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-line bg-elevated"
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
          ) : null}
          <View className="flex-1">
            <Text className="text-[28px] font-semibold tracking-tight text-ink">{title}</Text>
            {subtitle ? (
              <Text className="mt-1 text-sm leading-5 text-muted">{subtitle}</Text>
            ) : null}
          </View>
        </View>
      </View>
      {children}
    </View>
  );
}
