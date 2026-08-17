import { AuthLoadingScreen, useAuth } from '@/features/auth';
import { routes } from '@/shared/constants/routes';
import { Redirect, Stack, usePathname, type Href } from 'expo-router';

export default function StudentLayout() {
  const { isInitialized, isAuthenticated, needsOnboarding } = useAuth();
  const pathname = usePathname();
  const isOnboardingRoute =
    pathname === routes.onboarding || pathname.endsWith('/onboarding');

  if (!isInitialized) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href={routes.signIn} />;
  }

  if (needsOnboarding && !isOnboardingRoute) {
    return <Redirect href={routes.onboarding as Href} />;
  }

  if (!needsOnboarding && isOnboardingRoute) {
    return <Redirect href={routes.programs} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
