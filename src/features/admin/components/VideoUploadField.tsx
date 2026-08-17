import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
      type: 'video/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    onPick({
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      name: asset.name ?? null,
    });
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
          No celular, escolha da galeria ou dos arquivos. A pasta videos/ do computador sobe pelo
          seed (`npm run seed:workouts`) ou copiando o MP4 para o aparelho.
        </Text>
      )}

      <Pressable
        disabled={isUploading}
        onPress={() => void handlePick()}
        className={`mt-4 min-h-[52px] items-center justify-center rounded-2xl border border-primary/40 ${
          isUploading ? 'opacity-60' : 'active:opacity-85'
        }`}
      >
        {isUploading ? (
          <ActivityIndicator color="#E8573A" />
        ) : (
          <Text className="font-semibold text-primary">
            {currentUrl ? 'Trocar vídeo' : 'Selecionar vídeo'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
