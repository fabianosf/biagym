import '../global.css';

import { AuthProvider } from '@/features/auth';
import { NotificationsProvider } from '@/features/notifications';
import { OfflineProvider } from '@/features/offline';
import { ObservabilityProvider } from '@/features/observability';
import { AppErrorBoundary } from '@/shared/components';
import { AppThemeProvider, useThemeColors } from '@/shared/theme';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export const unstable_settings = {
  initialRouteName: '(student)',
};

function ThemedStack() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppThemeProvider>
          <AuthProvider>
            <ObservabilityProvider>
              <NotificationsProvider>
                <OfflineProvider>
                  <ThemedStack />
                </OfflineProvider>
              </NotificationsProvider>
            </ObservabilityProvider>
          </AuthProvider>
        </AppThemeProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
