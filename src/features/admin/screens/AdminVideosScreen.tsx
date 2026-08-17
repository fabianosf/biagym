import { Redirect } from 'expo-router';

import { adminRoutes } from '@/shared/constants/admin-routes';

export function AdminVideosScreen() {
  return <Redirect href={adminRoutes.exercises} />;
}
