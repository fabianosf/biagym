import { AppImage } from '@/shared/components/ui/AppImage';
import { isPlayableVideoUrl } from '@/shared/utils';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ImageSource } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type ExerciseMediaHeroProps = {
  videoUrl: string;
  thumbnail?: ImageSource;
  title: string;
  isResolvingVideo?: boolean;
};

export function ExerciseMediaHero({
  videoUrl,
  thumbnail,
  title,
  isResolvingVideo = false,
}: ExerciseMediaHeroProps) {
  const playableUrl = isPlayableVideoUrl(videoUrl) ? videoUrl.trim() : null;
  const [wantsVideo, setWantsVideo] = useState(false);

  useEffect(() => {
    setWantsVideo(false);
  }, [playableUrl, title]);

  if (wantsVideo && playableUrl) {
    return <HeroVideo url={playableUrl} title={title} />;
  }

  if (!thumbnail && !playableUrl && !isResolvingVideo) {
    return (
      <View className="aspect-[3/4] items-center justify-center rounded-[28px] bg-gymCard">
        <Ionicons name="barbell-outline" size={42} color="#737373" />
        <Text className="mt-3 px-6 text-center text-sm text-gymMuted">
          Ainda não tem vídeo deste exercício. Avise a treinadora.
        </Text>
      </View>
    );
  }

  const canPlay = Boolean(playableUrl) && !isResolvingVideo;

  return (
    <Pressable
      onPress={() => {
        if (canPlay) {
          setWantsVideo(true);
        }
      }}
      disabled={!canPlay}
      className="overflow-hidden rounded-[28px] bg-black"
      accessibilityRole="button"
      accessibilityLabel={canPlay ? `Assistir execução de ${title}` : `Foto de ${title}`}
    >
      {thumbnail ? (
        <AppImage source={thumbnail} aspectRatio={3 / 4} contentFit="cover" className="bg-black" />
      ) : (
        <View className="aspect-[3/4] items-center justify-center bg-gymCard">
          <Ionicons name="barbell-outline" size={42} color="#737373" />
        </View>
      )}

      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        {isResolvingVideo ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : canPlay ? (
          <View className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55">
              <Ionicons name="play" size={28} color="#FFFFFF" />
            </View>
            <View className="mt-4 rounded-full bg-black/55 px-4 py-2">
              <Text className="text-xs font-semibold text-white">Toque para ver a execução</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function HeroVideo({ url, title }: { url: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const lastUrlRef = useRef<string | null>(null);
  const player = useVideoPlayer(url, (instance) => {
    instance.timeUpdateEventInterval = 0.5;
    instance.play();
  });

  useEffect(() => {
    if (lastUrlRef.current === url) {
      return;
    }

    const shouldReplace = lastUrlRef.current !== null;
    lastUrlRef.current = url;

    if (!shouldReplace) {
      return;
    }

    try {
      player.replace(url);
      player.play();
    } catch {
      // keep last playable frame; native controls still allow retry
    }
  }, [player, url]);

  useEffect(() => {
    const playingSubscription = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
    });

    return () => {
      playingSubscription.remove();
    };
  }, [player]);

  function togglePlayback() {
    if (player.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  return (
    <View className="overflow-hidden rounded-[28px] bg-black">
      <VideoView
        player={player}
        style={{ width: '100%', aspectRatio: 3 / 4 }}
        contentFit="cover"
        nativeControls
        allowsFullscreen
        accessibilityLabel={`Vídeo de ${title}`}
      />
      {!isPlaying ? (
        <View pointerEvents="box-none" className="absolute inset-0 items-center justify-center">
          <Pressable
            onPress={togglePlayback}
            className="h-16 w-16 items-center justify-center rounded-full bg-black/55"
            accessibilityRole="button"
            accessibilityLabel="Assistir vídeo"
          >
            <Ionicons name="play" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
