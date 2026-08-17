import Ionicons from '@expo/vector-icons/Ionicons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { isPlayableVideoUrl } from '@/shared/utils';

const COMPLETION_THRESHOLD = 0.8;

type VideoPlayerProps = {
  videoUrl: string;
  onPlaybackProgress?: (progress: number) => void;
  onReady?: () => void;
  appearance?: 'light' | 'dark';
  showCompletionHint?: boolean;
};

export function VideoPlayer({
  videoUrl,
  onPlaybackProgress,
  onReady,
  appearance = 'light',
  showCompletionHint = true,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const playableUrl = isPlayableVideoUrl(videoUrl) ? videoUrl.trim() : null;
  const lastUrlRef = useRef<string | null>(null);

  const player = useVideoPlayer(playableUrl, (instance) => {
    instance.timeUpdateEventInterval = 0.5;
  });

  useEffect(() => {
    if (!playableUrl) {
      lastUrlRef.current = null;
      return;
    }

    if (lastUrlRef.current === playableUrl) {
      return;
    }

    const shouldReplace = lastUrlRef.current !== null;
    lastUrlRef.current = playableUrl;
    setPlaybackError(null);

    if (!shouldReplace) {
      return;
    }

    try {
      player.replace(playableUrl);
    } catch {
      setPlaybackError('Não foi possível carregar este vídeo. Tente abrir o exercício de novo.');
    }
  }, [playableUrl, player]);

  useEffect(() => {
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime }) => {
      const duration = player.duration;

      if (!Number.isFinite(duration) || duration <= 0) {
        return;
      }

      const progress = currentTime / duration;
      setPlaybackProgress(Number.isFinite(progress) ? progress : 0);
      onPlaybackProgress?.(progress);
    });

    const playingSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        setPlaybackError(null);
        onReady?.();
      }

      if (status === 'error') {
        setPlaybackError('O vídeo não reproduziu. Confira se o MP4 foi enviado e tente de novo.');
      }
    });

    return () => {
      timeSubscription.remove();
      playingSubscription.remove();
      statusSubscription.remove();
    };
  }, [onPlaybackProgress, onReady, player]);

  if (!playableUrl) {
    return (
      <View
        className={`aspect-video items-center justify-center rounded-card border ${
          appearance === 'dark' ? 'border-gymLine bg-gymCard' : 'border-line bg-elevated'
        }`}
      >
        <Text className={appearance === 'dark' ? 'text-sm text-gymMuted' : 'text-sm text-muted'}>
          Vídeo indisponível.
        </Text>
      </View>
    );
  }

  function togglePlayback() {
    if (player.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  return (
    <View className={`overflow-hidden rounded-card border ${appearance === 'dark' ? 'border-gymLine bg-black' : 'border-line bg-black'}`}>
      <VideoView
        player={player}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        allowsPictureInPicture
      />

      <View className={`gap-4 p-5 ${appearance === 'dark' ? 'bg-gymCard' : 'bg-surface'}`}>
        {playbackError ? (
          <Text className={appearance === 'dark' ? 'text-sm text-red-300' : 'text-sm text-red-400'}>
            {playbackError}
          </Text>
        ) : null}
        <ProgressBar value={playbackProgress * 100} showPercentage={false} size="sm" />

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={togglePlayback}
            className="h-12 flex-row items-center rounded-2xl bg-primary px-5 active:opacity-90"
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
            <Text className="ml-2 font-semibold text-white">
              {isPlaying ? 'Pausar' : 'Reproduzir'}
            </Text>
          </Pressable>

          {showCompletionHint ? (
            <Text className={`ml-4 flex-1 text-right text-xs leading-5 ${appearance === 'dark' ? 'text-gymMuted' : 'text-muted'}`}>
              {playbackProgress >= COMPLETION_THRESHOLD
                ? 'Pronto para concluir'
                : `Assista ${Math.round(COMPLETION_THRESHOLD * 100)}% para concluir`}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export { COMPLETION_THRESHOLD };
