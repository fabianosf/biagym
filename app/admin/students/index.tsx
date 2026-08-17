import { Redirect } from 'expo-router';

import { adminRoutes } from '@/shared/constants/admin-routes';

export default function AdminStudentsIndex() {
  return <Redirect href={adminRoutes.home} />;
}
