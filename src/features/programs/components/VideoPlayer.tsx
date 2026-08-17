import Ionicons from '@expo/vector-icons/Ionicons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ProgressBar } from '@/shared/components/ui/ProgressBar';

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

  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.timeUpdateEventInterval = 0.5;
  });

  useEffect(() => {
    const timeSubscription = player.addListener('timeUpdate', ({ currentTime }) => {
      const duration = player.duration;

      if (duration <= 0) {
        return;
      }

      const progress = currentTime / duration;
      setPlaybackProgress(progress);
      onPlaybackProgress?.(progress);
    });

    const playingSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        onReady?.();
      }
    });

    return () => {
      timeSubscription.remove();
      playingSubscription.remove();
      statusSubscription.remove();
    };
  }, [onPlaybackProgress, onReady, player]);

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
        nativeControls={false}
        allowsFullscreen
        allowsPictureInPicture
      />

      <View className={`gap-4 p-5 ${appearance === 'dark' ? 'bg-gymCard' : 'bg-surface'}`}>
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
