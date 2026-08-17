import { AuthLoadingScreen, getAuthenticatedHomeRoute, useAuth } from '@/features/auth';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const { isInitialized, isAuthenticated, user } = useAuth();

  if (!isInitialized) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && user) {
    return <Redirect href={getAuthenticatedHomeRoute(user)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
