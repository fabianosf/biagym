import { Redirect } from 'expo-router';

import { adminRoutes } from '@/shared/constants/admin-routes';

/** A lista de alunos agora é a tela inicial do painel. */
export function AdminStudentsScreen() {
  return <Redirect href={adminRoutes.home} />;
}
