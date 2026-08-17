import { useNotificationPreferences } from '@/features/notifications/hooks/useNotificationPreferences';
import { getExpoGoPushLimitationMessage } from '@/services/notifications/push-notification.runtime';
import { Button, Card, FeedbackBanner } from '@/shared/components';
import { ActivityIndicator, Switch, Text, View } from 'react-native';

export function NotificationSettingsCard() {
  const {
    preferences,
    permissionStatus,
    isLoading,
    isSaving,
    isSendingTest,
    error,
    success,
    isPushLimitedInRuntime,
    toggleNotifications,
    sendTestNotification,
  } = useNotificationPreferences();

  return (
    <Card>
      <Text className="text-lg font-semibold text-ink">Notificações</Text>
      <Text className="mt-1 text-sm text-muted">
        Lembretes de treino, novos programas e aulas liberadas.
      </Text>

      {isPushLimitedInRuntime ? (
        <View className="mt-4">
          <FeedbackBanner message={getExpoGoPushLimitationMessage()} variant="warning" />
        </View>
      ) : null}

      {isLoading ? (
        <View className="py-6">
          <ActivityIndicator color="#E8573A" />
        </View>
      ) : (
        <>
          <View className="mt-5 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-medium text-ink">Ativar notificações</Text>
              <Text className="mt-1 text-xs leading-5 text-faint">
                Você controla quando receber alertas. Sem spam no primeiro acesso.
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              disabled={isSaving || isPushLimitedInRuntime}
              onValueChange={(value) => void toggleNotifications(value)}
              trackColor={{ false: '#ECECEC', true: '#E8573A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {permissionStatus !== 'granted' && preferences.enabled ? (
            <Text className="mt-3 text-xs text-amber-200">
              Permissão do sistema: {permissionStatus}. Verifique Ajustes do dispositivo.
            </Text>
          ) : null}

          {preferences.enabled ? (
            <Button
              className="mt-4"
              variant="secondary"
              label="Enviar notificação de teste"
              onPress={() => void sendTestNotification()}
              loading={isSendingTest}
            />
          ) : null}
        </>
      )}

      {error ? (
        <View className="mt-3">
          <FeedbackBanner message={error} variant="warning" />
        </View>
      ) : null}

      {success ? (
        <View className="mt-3">
          <FeedbackBanner message={success} variant="success" />
        </View>
      ) : null}
    </Card>
  );
}
