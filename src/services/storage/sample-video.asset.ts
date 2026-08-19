import { Asset } from 'expo-asset';

import { SAMPLE_WORKOUT_VIDEOS, type SampleWorkoutVideo } from '@/shared/constants/sample-workout-videos';
import { DataServiceError, withTimeout } from '../shared';

const SAMPLE_ASSET_DOWNLOAD_TIMEOUT_MS = 20_000;

export async function resolveSampleWorkoutVideo(sample: SampleWorkoutVideo): Promise<{
  uri: string;
  mimeType: 'video/mp4';
  name: string;
}> {
  const asset = Asset.fromModule(sample.module);
  await withTimeout(
    asset.downloadAsync(),
    SAMPLE_ASSET_DOWNLOAD_TIMEOUT_MS,
    `Não foi possível baixar ${sample.fileName} agora. Verifique a conexão e tente de novo.`,
  );
  const uri = asset.localUri ?? asset.uri;

  if (!uri) {
    throw new DataServiceError(
      'unknown',
      undefined,
      `Não foi possível ler ${sample.fileName} da pasta videos/. Recarregue o app com cache limpo.`,
    );
  }

  return {
    uri,
    mimeType: 'video/mp4',
    name: sample.fileName,
  };
}

export function getSampleWorkoutVideo(id: string): SampleWorkoutVideo | undefined {
  return SAMPLE_WORKOUT_VIDEOS.find((item) => item.id === id);
}
