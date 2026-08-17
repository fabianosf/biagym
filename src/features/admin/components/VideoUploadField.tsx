import { colors } from '@/shared/theme';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { SAMPLE_WORKOUT_VIDEOS } from '@/shared/constants/sample-workout-videos';
import { resolveSampleWorkoutVideo } from '@/services';

export type PickedVideo = {
  uri: string;
  mimeType: string | null;
  name: string | null;
};

type VideoUploadFieldProps = {
  currentUrl?: string;
  isUploading: boolean;
  onPick: (file: PickedVideo) => void;
  label?: string;
  compact?: boolean;
};

export function VideoUploadField({
  currentUrl,
  isUploading,
  onPick,
  label = 'Vídeo do exercício',
  compact = false,
}: VideoUploadFieldProps) {
  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/mp4', 'video/quicktime', 'video/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    onPick({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'video/mp4',
      name: asset.name ?? 'video.mp4',
    });
  }

  async function handleSample(id: string) {
    const sample = SAMPLE_WORKOUT_VIDEOS.find((item) => item.id === id);
    if (!sample) {
      return;
    }

    try {
      const file = await resolveSampleWorkoutVideo(sample);
      onPick(file);
    } catch (error) {
      Alert.alert(
        'Vídeo de exemplo',
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o MP4 da pasta videos/.',
      );
    }
  }

  return (
    <View className={compact ? '' : 'rounded-card border border-line bg-surface p-5'}>
      {compact ? null : <Text className="text-sm font-semibold text-ink">{label}</Text>}
      {currentUrl ? (
        <Text className="mt-2 text-xs text-muted" numberOfLines={2}>
          {currentUrl}
        </Text>
      ) : compact ? null : (
        <Text className="mt-2 text-sm text-faint">Nenhum vídeo selecionado ainda.</Text>
      )}
      {compact ? null : (
        <Text className="mt-2 text-xs leading-5 text-faint">
          Use um MP4 da pasta videos/ (botões abaixo) ou escolha um arquivo do celular.
        </Text>
      )}

      <Text className={`text-xs font-medium text-muted ${compact ? 'mb-2' : 'mt-3 mb-2'}`}>
        Exemplos da pasta videos/
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SAMPLE_WORKOUT_VIDEOS.map((sample) => (
          <Pressable
            key={sample.id}
            disabled={isUploading}
            onPress={() => void handleSample(sample.id)}
            className="rounded-full bg-elevated px-3 py-2"
          >
            <Text className="text-xs font-semibold text-ink">{sample.fileName}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        disabled={isUploading}
        onPress={() => void handlePick()}
        className={`mt-4 min-h-[52px] items-center justify-center rounded-2xl border border-primary/40 ${
          isUploading ? 'opacity-60' : 'active:opacity-85'
        }`}
      >
        {isUploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text className="font-semibold text-primary">
            {currentUrl ? 'Trocar vídeo do aparelho' : 'Selecionar vídeo do aparelho'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
