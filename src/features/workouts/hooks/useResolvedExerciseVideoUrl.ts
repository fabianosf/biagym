import type { Exercise } from '@/domain/workout';
import { pickSampleWorkoutVideoForExercise } from '@/features/workouts/utils/exercise-media';
import { CONNECTIVITY_TIMEOUT_MS, resolveSampleWorkoutVideo, withTimeout } from '@/services';
import { isPlayableVideoUrl } from '@/shared/utils';
import { useEffect, useState } from 'react';

export function useResolvedExerciseVideoUrl(exercise: Exercise | null | undefined) {
  const playableRemote =
    exercise && isPlayableVideoUrl(exercise.videoUrl) ? exercise.videoUrl.trim() : '';
  const [videoUrl, setVideoUrl] = useState(playableRemote);
  const [isResolving, setIsResolving] = useState(!playableRemote && Boolean(exercise));

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!exercise) {
        if (!cancelled) {
          setVideoUrl('');
          setIsResolving(false);
        }
        return;
      }

      if (playableRemote) {
        if (!cancelled) {
          setVideoUrl(playableRemote);
          setIsResolving(false);
        }
        return;
      }

      const sample = pickSampleWorkoutVideoForExercise(exercise);
      if (!sample) {
        if (!cancelled) {
          setVideoUrl('');
          setIsResolving(false);
        }
        return;
      }

      setIsResolving(true);
      try {
        const file = await withTimeout(
          resolveSampleWorkoutVideo(sample),
          CONNECTIVITY_TIMEOUT_MS,
          'Não foi possível abrir o vídeo deste exercício agora.',
        );
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
  }, [exercise, playableRemote]);

  return { videoUrl, isResolving };
}
