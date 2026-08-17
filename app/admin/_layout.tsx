import { AuthLoadingScreen, useAuth } from '@/features/auth';
import { routes } from '@/shared/constants/routes';
import { Redirect, Stack } from 'expo-router';

export default function AdminLayout() {
  const { isInitialized, isAuthenticated, isAdmin, canOpenAdmin } = useAuth();

  if (!isInitialized) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href={routes.signIn} />;
  }

  if (!canOpenAdmin || !isAdmin) {
    return <Redirect href={routes.programs} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
