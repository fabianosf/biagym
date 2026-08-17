import { getLocalLessonVideoUri } from '@/services';
import { isPlayableVideoUrl } from '@/shared/utils';
import { useEffect, useState } from 'react';

export function useResolvedLessonVideoUrl(
  lessonId: string | undefined,
  remoteUrl: string | undefined,
) {
  const playableRemote = isPlayableVideoUrl(remoteUrl) ? remoteUrl : '';
  const [videoUrl, setVideoUrl] = useState(playableRemote);

  useEffect(() => {
    if (!lessonId || !playableRemote) {
      setVideoUrl('');
      return;
    }

    let cancelled = false;

    void (async () => {
      const localUri = await getLocalLessonVideoUri(lessonId);
      if (!cancelled) {
        setVideoUrl(localUri ?? playableRemote);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId, playableRemote]);

  return videoUrl;
}
