import { useAuth } from '@/features/auth';
import type { CoachMessage } from '@/domain/messaging';
import {
  listCoachMessages,
  markCoachMessagesRead,
  sendCoachMessage,
  uploadMessageAttachment,
} from '@/services';
import { AppImage, Button, ScreenHeader } from '@/shared/components';
import { getFriendlyErrorMessage } from '@/shared/errors';
import { useT } from '@/shared/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type MessagesThreadProps = {
  studentUserId?: string;
  title?: string;
  onBack?: () => void;
};

export function MessagesThread({ studentUserId, title, onBack }: MessagesThreadProps) {
  const t = useT();
  const { user, isAdmin } = useAuth();
  const threadId = studentUserId ?? user?.id;
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [body, setBody] = useState('');
  const [pendingImage, setPendingImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
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

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('messages.photoPermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    setPendingImage(result.assets[0]);
  }

  async function handleSend() {
    if (!user || !threadId || (body.trim().length === 0 && !pendingImage)) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const attachmentUrl = pendingImage
        ? await uploadMessageAttachment({
            studentUserId: threadId,
            fileUri: pendingImage.uri,
            mimeType: pendingImage.mimeType,
            fileName: pendingImage.fileName,
          })
        : undefined;

      await sendCoachMessage({
        studentUserId: threadId,
        senderId: user.id,
        body,
        attachmentUrl,
      });
      setBody('');
      setPendingImage(null);
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
          subtitle={t('messages.subtitle')}
          showBack={Boolean(onBack)}
          onBack={onBack}
        />
      ) : null}
      <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-6">
        {messages.length === 0 ? (
          <Text className="text-muted">{t('messages.empty')}</Text>
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
                  {mine ? t('messages.you') : message.senderName}
                </Text>
                {message.attachmentUrl ? (
                  <AppImage
                    uri={message.attachmentUrl}
                    aspectRatio={4 / 3}
                    className="mt-2 w-full rounded-xl"
                  />
                ) : null}
                {message.body ? (
                  <Text className={`mt-1 text-sm leading-5 ${mine ? 'text-white' : 'text-ink'}`}>
                    {message.body}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
      <View className="border-t border-line bg-background px-5 py-4">
        {error ? <Text className="mb-2 text-sm text-red-400">{error}</Text> : null}
        {pendingImage ? (
          <View className="mb-3 flex-row items-center gap-3">
            <AppImage uri={pendingImage.uri} aspectRatio={1} className="h-16 w-16 rounded-xl" />
            <Pressable onPress={() => setPendingImage(null)}>
              <Text className="text-sm text-red-400">{t('messages.removePhoto')}</Text>
            </Pressable>
          </View>
        ) : null}
        <View className="mb-3 flex-row items-end gap-2">
          <Pressable
            onPress={() => void handlePickImage()}
            className="h-[52px] w-[52px] items-center justify-center rounded-2xl border border-line bg-elevated"
            accessibilityRole="button"
            accessibilityLabel={t('messages.attachPhoto')}
          >
            <Ionicons name="image-outline" size={20} color="#9B9B9B" />
          </Pressable>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t('messages.inputPlaceholder')}
            placeholderTextColor="#9B9B9B"
            multiline
            className="min-h-[52px] flex-1 rounded-2xl border border-line bg-elevated px-4 py-3 text-ink"
          />
        </View>
        <Button label={t('messages.send')} loading={isSending} onPress={() => void handleSend()} />
      </View>
    </View>
  );
}

export function StudentMessagesScreen() {
  const router = useRouter();
  const t = useT();

  return (
    <View className="flex-1 bg-background">
      <MessagesThread title={t('messages.title')} onBack={() => router.back()} />
    </View>
  );
}
