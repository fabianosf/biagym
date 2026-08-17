import type { ProgramWithProgress } from '@/domain/progress';
import { deriveProgressStatus } from '@/domain/progress';
import { useAuth } from '@/features/auth';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DATA_FETCH_TIMEOUT_MS, listMergedUserProgress, listProgramsByIds, withTimeout } from '@/services';
import { getFriendlyErrorMessage } from '@/shared/errors';

type StudentProgressState = {
  items: ProgramWithProgress[];
  isLoading: boolean;
  error: string | null;
};

export function useStudentProgress() {
  const { user, isInitialized } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<StudentProgressState>({
    items: [],
    isLoading: true,
    error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (isRefresh = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!isInitialized) {
      return;
    }

    if (!userId) {
      setState({ items: [], isLoading: false, error: null });
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setState((current) => ({ ...current, isLoading: true, error: null }));
    }

    try {
      const progressItems = await withTimeout(
        listMergedUserProgress(userId),
        DATA_FETCH_TIMEOUT_MS,
        'O progresso demorou demais para carregar. Tente novamente.',
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      const startedItems = progressItems.filter(
        (progress) => deriveProgressStatus(progress) !== 'not_started',
      );

      if (startedItems.length === 0) {
        setState({ items: [], isLoading: false, error: null });
        return;
      }

      const programs = await withTimeout(
        listProgramsByIds(startedItems.map((progress) => progress.programId)),
        DATA_FETCH_TIMEOUT_MS,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      const programMap = new Map(programs.map((program) => [program.id, program]));
      const items: ProgramWithProgress[] = [];

      for (const progress of startedItems) {
        const program = programMap.get(progress.programId);
        if (!program) {
          continue;
        }

        items.push({
          program,
          progress,
          status: deriveProgressStatus(progress),
        });
      }

      items.sort((a, b) => {
        return (b.progress?.lastAccessedAt ?? '').localeCompare(
          a.progress?.lastAccessedAt ?? '',
        );
      });

      setState({ items, isLoading: false, error: null });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState({
        items: [],
        isLoading: false,
        error: getFriendlyErrorMessage(error),
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [isInitialized, userId]);

  useEffect(() => {
    void load(false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const refetch = useCallback(() => load(true), [load]);

  return {
    ...state,
    isRefreshing,
    refetch,
  };
}
