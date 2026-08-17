import { AdminNavCard, AdminShell } from '@/features/admin/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import type { Href } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export function AdminHomeScreen() {
  return (
    <AdminShell
      title="Painel da treinadora"
      subtitle="Montar treinos, alimentação, agenda e acompanhar alunos."
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-card border border-line bg-surface p-5">
          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            Ordem de cadastro
          </Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            1. Exercícios e vídeos{'\n'}
            2. Criar Treino A, B, C{'\n'}
            3. Incluir exercícios com séries, reps, kg e descanso{'\n'}
            4. Publicar{'\n'}
            5. Liberar para o aluno
          </Text>
        </View>

        <AdminNavCard
          title="Treinos A / B / C"
          description="Criar fichas, series, reps, carga e descanso"
          href={adminRoutes.workouts as Href}
          icon="barbell-outline"
        />
        <AdminNavCard
          title="Exercícios e vídeos"
          description="Upload de vídeo e catálogo de exercícios"
          href={adminRoutes.exercises as Href}
          icon="videocam-outline"
        />
        <AdminNavCard
          title="Liberar treinos"
          description="Escolher quais alunos veem cada treino"
          href={adminRoutes.workoutAccess as Href}
          icon="key-outline"
        />
        <AdminNavCard
          title="Programas e aulas"
          description="Criar séries, semanas e fazer upload de vídeos"
          href={adminRoutes.programs}
          icon="play-circle-outline"
        />
        <AdminNavCard
          title="Nutrição"
          description="Montar planos de alimentação por aluno ou para a turma"
          href={adminRoutes.nutrition as Href}
          icon="nutrition-outline"
        />
        <AdminNavCard
          title="Agenda de treinos"
          description="Definir dias e horários de treino de cada aluno"
          href={adminRoutes.schedule as Href}
          icon="calendar-outline"
        />
        <AdminNavCard
          title="Alunos"
          description="Ver peso, altura, idade e objetivo"
          href={adminRoutes.students as Href}
          icon="people-outline"
        />
        <AdminNavCard
          title="Recados"
          description="Mandar orientação e ver a evolução do aluno"
          href={adminRoutes.messages as Href}
          icon="chatbubbles-outline"
        />
        <AdminNavCard
          title="Liberação de acesso"
          description="Conceder ou remover acesso aos programas"
          href={adminRoutes.access}
          icon="key-outline"
        />
      </ScrollView>
    </AdminShell>
  );
}
