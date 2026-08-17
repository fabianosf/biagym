import '../global.css';

import { AuthProvider } from '@/features/auth';
import { NotificationsProvider } from '@/features/notifications';
import { OfflineProvider } from '@/features/offline';
import { ObservabilityProvider } from '@/features/observability';
import { AppErrorBoundary } from '@/shared/components';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export const unstable_settings = {
  initialRouteName: '(student)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <ObservabilityProvider>
            <NotificationsProvider>
              <OfflineProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#FFFFFF' },
                  }}
                />
              </OfflineProvider>
            </NotificationsProvider>
          </ObservabilityProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
