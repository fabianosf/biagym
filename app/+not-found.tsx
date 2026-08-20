import { EmptyState } from '@/shared/components';
import { useT } from '@/shared/theme';
import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const t = useT();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title'), headerShown: true }} />
      <View className="flex-1 bg-background px-6 pt-8">
        <EmptyState
          icon="folder-open-outline"
          title={t('notFound.screenTitle')}
          description={t('notFound.description')}
        />
        <Link href="/" asChild>
          <Pressable className="mt-6 items-center rounded-xl bg-white py-3">
            <Text className="font-semibold text-background">{t('notFound.backHome')}</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
