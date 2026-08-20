import { useAuth } from '@/features/auth';
import type { BodyLog } from '@/domain/student';
import { createBodyLog, listBodyLogs, uploadBodyPhoto } from '@/services';
import { AppImage, Button, Card, ScreenHeader, TextField } from '@/shared/components';
import { getFriendlyErrorMessage } from '@/shared/errors';
import { usePreferencesStore, useT } from '@/shared/theme';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const INTL_LOCALE: Record<string, string> = { 'pt-BR': 'pt-BR', en: 'en-US' };

function formatLogDate(value: string, intlLocale: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString(intlLocale);
}

export function EvolutionScreen() {
  const router = useRouter();
  const t = useT();
  const locale = usePreferencesStore((state) => state.locale);
  const { user } = useAuth();
  const [logs, setLogs] = useState<BodyLog[]>([]);
  const [weightKg, setWeightKg] = useState(user?.bodyMetrics?.weightKg?.toString() ?? '');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLogs(await listBodyLogs(user.id));
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  }, [user]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  async function handlePickPhoto() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setPhotoName(asset.name ?? null);
    setPhotoType(asset.mimeType ?? null);
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    const weight = Number(weightKg.replace(',', '.'));
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      setError(t('evolution.invalidWeight'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const photoUrl = photoUri
        ? await uploadBodyPhoto({
            userId: user.id,
            fileUri: photoUri,
            mimeType: photoType,
            fileName: photoName,
          })
        : undefined;

      await createBodyLog({
        userId: user.id,
        weightKg: weight,
        notes: notes || undefined,
        photoUrl,
      });
      setNotes('');
      setPhotoUri(null);
      await loadLogs();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={t('evolution.title')}
        subtitle={t('evolution.subtitle')}
        showBack
        onBack={() => router.back()}
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
        <Card className="gap-4">
          <TextField
            label={t('evolution.currentWeight')}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            placeholder="85"
            icon="barbell-outline"
          />
          <TextField
            label={t('evolution.feelingLabel')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('evolution.feelingPlaceholder')}
            icon="chatbubble-outline"
          />
          <Pressable
            onPress={() => void handlePickPhoto()}
            className="min-h-[48px] items-center justify-center rounded-2xl border border-primary/40"
          >
            <Text className="font-semibold text-primary">
              {photoUri ? t('evolution.changePhoto') : t('evolution.attachPhoto')}
            </Text>
          </Pressable>
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}
          <Button label={t('evolution.saveRecord')} loading={isSaving} onPress={() => void handleSave()} />
        </Card>

        {logs.map((log) => (
          <Card key={log.id}>
            <Text className="text-xs uppercase tracking-[1.4px] text-muted">
              {formatLogDate(log.recordedAt, INTL_LOCALE[locale] ?? 'pt-BR')}
            </Text>
            <Text className="mt-1 text-lg font-semibold text-ink">{log.weightKg} kg</Text>
            {log.notes ? <Text className="mt-1 text-sm text-muted">{log.notes}</Text> : null}
            {log.photoUrl ? <AppImage className="mt-3 rounded-2xl" uri={log.photoUrl} aspectRatio={3 / 4} /> : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
