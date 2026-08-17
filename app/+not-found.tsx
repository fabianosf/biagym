import { EmptyState } from '@/shared/components';
import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Não encontrado', headerShown: true }} />
      <View className="flex-1 bg-background px-6 pt-8">
        <EmptyState
          icon="folder-open-outline"
          title="Tela não encontrada"
          description="O endereço acessado não existe ou foi movido."
        />
        <Link href="/" asChild>
          <Pressable className="mt-6 items-center rounded-xl bg-white py-3">
            <Text className="font-semibold text-background">Voltar ao início</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
