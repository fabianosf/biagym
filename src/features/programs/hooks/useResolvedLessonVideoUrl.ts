import {
  CONNECTIVITY_TIMEOUT_MS,
  getLocalLessonVideoUri,
  resolveLessonVideoPlayableUrl,
  resolveSampleWorkoutVideo,
  withTimeout,
} from '@/services';
import { SAMPLE_WORKOUT_VIDEOS } from '@/shared/constants/sample-workout-videos';
import { isPlayableVideoUrl } from '@/shared/utils';
import { useEffect, useState } from 'react';

function pickSampleForLesson(lessonId: string) {
  const total = SAMPLE_WORKOUT_VIDEOS.length;
  if (total === 0) {
    return undefined;
  }

  let hash = 0;
  for (const char of lessonId) {
    hash = (hash + char.charCodeAt(0)) % total;
  }

  return SAMPLE_WORKOUT_VIDEOS[hash];
}

export function useResolvedLessonVideoUrl(
  lessonId: string | undefined,
  remoteUrl: string | undefined,
) {
  const playableRemote = isPlayableVideoUrl(remoteUrl) ? remoteUrl.trim() : '';
  const [videoUrl, setVideoUrl] = useState(playableRemote);
  const [isResolving, setIsResolving] = useState(!playableRemote);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (lessonId && playableRemote) {
        setIsResolving(true);
        try {
          const localUri = await withTimeout(
            getLocalLessonVideoUri(lessonId),
            CONNECTIVITY_TIMEOUT_MS,
          );
          if (localUri) {
            if (!cancelled) {
              setVideoUrl(localUri);
            }
          } else {
            const playable = await resolveLessonVideoPlayableUrl(playableRemote);
            if (!cancelled) {
              setVideoUrl(playable);
            }
          }
        } catch {
          if (!cancelled) {
            setVideoUrl(playableRemote);
          }
        } finally {
          if (!cancelled) {
            setIsResolving(false);
          }
        }
        return;
      }

      const sample = lessonId ? pickSampleForLesson(lessonId) : SAMPLE_WORKOUT_VIDEOS[0];
      if (!sample) {
        if (!cancelled) {
          setVideoUrl('');
          setIsResolving(false);
        }
        return;
      }

      setIsResolving(true);
      try {
        const file = await resolveSampleWorkoutVideo(sample);
        if (!cancelled) {
          setVideoUrl(file.uri);
        }
      } catch {
        if (!cancelled) {
          setVideoUrl('');
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId, playableRemote]);

  return { videoUrl, isResolving };
}
