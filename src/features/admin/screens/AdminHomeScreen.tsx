import { AdminDashboard, AdminShell, AdminStudentRoster } from '@/features/admin/components';
import { useT } from '@/shared/theme';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export function AdminHomeScreen() {
  const t = useT();
  const router = useRouter();

  return (
    <AdminShell
      title="Painel da treinadora"
      subtitle="Toque no aluno. Tudo que você fizer a partir daqui é só dele."
      showBack
      onBack={() => router.back()}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <AdminDashboard />

        <View className="px-5">
          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentsTitle')}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            {t('admin.studentsHint')}
          </Text>
        </View>

        <AdminStudentRoster />
      </ScrollView>
    </AdminShell>
  );
}
