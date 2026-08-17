import { useAuth } from '@/features/auth';
import type { CoachMessage } from '@/domain/messaging';
import { listCoachMessages, markCoachMessagesRead, sendCoachMessage } from '@/services';
import { Button, ScreenHeader } from '@/shared/components';
import { getFriendlyErrorMessage } from '@/shared/errors';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

type MessagesThreadProps = {
  studentUserId?: string;
  title?: string;
  onBack?: () => void;
};

export function MessagesThread({ studentUserId, title, onBack }: MessagesThreadProps) {
  const { user, isAdmin } = useAuth();
  const threadId = studentUserId ?? user?.id;
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    if (!threadId) {
      return;
    }

    try {
      const data = await listCoachMessages(threadId);
      setMessages(data);
      if (!isAdmin) {
        await markCoachMessagesRead(threadId);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  }, [isAdmin, threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSend() {
    if (!user || !threadId || body.trim().length === 0) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendCoachMessage({
        studentUserId: threadId,
        senderId: user.id,
        body,
      });
      setBody('');
      await load();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View className="flex-1">
      {title ? (
        <ScreenHeader
          title={title}
          subtitle="Conversem sobre o treino, a dieta e as dúvidas da semana."
          showBack={Boolean(onBack)}
          onBack={onBack}
        />
      ) : null}
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-6">
        {messages.length === 0 ? (
          <Text className="text-muted">Nenhum recado ainda. Envie o primeiro.</Text>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === user?.id;
            return (
              <View
                key={message.id}
                className={`max-w-[86%] rounded-2xl px-4 py-3 ${
                  mine ? 'self-end bg-primary' : 'self-start border border-line bg-surface'
                }`}
              >
                <Text className={`text-xs ${mine ? 'text-white/80' : 'text-muted'}`}>
                  {mine ? 'Você' : message.senderName}
                </Text>
                <Text className={`mt-1 text-sm leading-5 ${mine ? 'text-white' : 'text-ink'}`}>
                  {message.body}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
      <View className="border-t border-line bg-background px-5 py-4">
        {error ? <Text className="mb-2 text-sm text-red-400">{error}</Text> : null}
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Escreva um recado..."
          placeholderTextColor="#9B9B9B"
          multiline
          className="mb-3 min-h-[52px] rounded-2xl border border-line bg-elevated px-4 py-3 text-ink"
        />
        <Button label="Enviar" loading={isSending} onPress={() => void handleSend()} />
      </View>
    </View>
  );
}

export function StudentMessagesScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <MessagesThread title="Recados" onBack={() => router.back()} />
    </View>
  );
}
