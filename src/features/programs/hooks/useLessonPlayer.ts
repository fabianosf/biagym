import { useAuth } from '@/features/auth';
import { useOfflineStore } from '@/features/offline/store/offline.store';
import { useCallback, useEffect, useState } from 'react';

import {
  buildLocalProgressRecord,
  countPendingProgressActions,
  markLessonCompleteWithSync,
  touchLessonAccessWithSync,
} from '@/services';
import { getFriendlyErrorMessage } from '@/shared/errors';
import * as Haptics from 'expo-haptics';
import type { Lesson } from '@/domain/program';
import type { UserProgress } from '@/domain/progress';

import {
  acceptMedicalDisclaimer,
  hasAcceptedMedicalDisclaimer,
} from '../utils/medical-disclaimer.storage';

type UseLessonPlayerOptions = {
  programId: string | undefined;
  lesson: Lesson | null | undefined;
  totalLessons: number;
  currentProgress?: UserProgress | null;
  initiallyCompleted?: boolean;
  onProgressUpdated?: (progress: UserProgress) => void;
  onSyncStateChange?: (state: 'synced' | 'queued') => void;
};

export function useLessonPlayer({
  programId,
  lesson,
  totalLessons,
  currentProgress = null,
  initiallyCompleted = false,
  onProgressUpdated,
  onSyncStateChange,
}: UseLessonPlayerOptions) {
  const { user } = useAuth();
  const setPendingCount = useOfflineStore((state) => state.setPendingCount);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [canMarkComplete, setCanMarkComplete] = useState(initiallyCompleted);
  const [isCompleted, setIsCompleted] = useState(initiallyCompleted);
  const [isMarking, setIsMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    setIsCompleted(initiallyCompleted);
    setCanMarkComplete(initiallyCompleted);
  }, [initiallyCompleted, lesson?.id]);

  useEffect(() => {
    if (initiallyCompleted) {
      return;
    }

    setCanMarkComplete(playbackProgress >= 0.8);
  }, [initiallyCompleted, playbackProgress]);

  useEffect(() => {
    void (async () => {
      const accepted = await hasAcceptedMedicalDisclaimer();
      setDisclaimerChecked(true);
      setShowDisclaimer(!accepted);
    })();
  }, []);

  useEffect(() => {
    if (!user || !programId || !lesson || videoStarted) {
      return;
    }

    const accessedAt = new Date().toISOString();

    void (async () => {
      const result = await touchLessonAccessWithSync({
        userId: user.id,
        programId,
        lessonId: lesson.id,
        accessedAt,
      });
      onProgressUpdated?.(result.progress);
      if (result.syncState === 'queued') {
        const pendingCount = await countPendingProgressActions(user.id);
        setPendingCount(pendingCount);
      }
    })();

    setVideoStarted(true);
  }, [lesson, onProgressUpdated, programId, setPendingCount, user, videoStarted]);

  const handlePlaybackProgress = useCallback((progress: number) => {
    setPlaybackProgress(progress);
  }, []);

  const handleAcceptDisclaimer = useCallback(async () => {
    await acceptMedicalDisclaimer();
    setShowDisclaimer(false);
  }, []);

  const markComplete = useCallback(async () => {
    if (!user || !programId || !lesson || isCompleted || isMarking) {
      return;
    }

    setIsMarking(true);
    setMarkError(null);
    setSyncMessage(null);

    const accessedAt = new Date().toISOString();
    const optimistic = buildLocalProgressRecord(
      {
        userId: user.id,
        programId,
        lessonId: lesson.id,
        totalLessons,
        accessedAt,
      },
      currentProgress,
    );

    setIsCompleted(true);
    onProgressUpdated?.(optimistic);

    try {
      const result = await markLessonCompleteWithSync({
        userId: user.id,
        programId,
        lessonId: lesson.id,
        totalLessons,
        accessedAt,
      });

      onProgressUpdated?.(result.progress);
      onSyncStateChange?.(result.syncState);

      if (result.syncState === 'queued') {
        setSyncMessage('Progresso salvo localmente. Será sincronizado quando você voltar online.');
        const pendingCount = await countPendingProgressActions(user.id);
        setPendingCount(pendingCount);
      } else {
        setSyncMessage(null);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      setIsCompleted(false);
      setMarkError(getFriendlyErrorMessage(error));
    } finally {
      setIsMarking(false);
    }
  }, [
    isCompleted,
    isMarking,
    lesson,
    onProgressUpdated,
    onSyncStateChange,
    programId,
    currentProgress,
    setPendingCount,
    totalLessons,
    user,
  ]);

  return {
    playbackProgress,
    canMarkComplete,
    isCompleted,
    isMarking,
    markError,
    syncMessage,
    showDisclaimer: disclaimerChecked && showDisclaimer,
    handlePlaybackProgress,
    handleAcceptDisclaimer,
    markComplete,
  };
}
