import type { ProgramWithProgress } from '@/domain/progress';
import { deriveProgressStatus } from '@/domain/progress';
import { useAuth } from '@/features/auth';
import { useCallback, useEffect, useState } from 'react';

import { listMergedUserProgress, listProgramsByIds } from '@/services';
import { getFriendlyErrorMessage } from '@/shared/errors';

type StudentProgressState = {
  items: ProgramWithProgress[];
  isLoading: boolean;
  error: string | null;
};

export function useStudentProgress() {
  const { user } = useAuth();
  const [state, setState] = useState<StudentProgressState>({
    items: [],
    isLoading: true,
    error: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!user) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setState((current) => ({ ...current, isLoading: true, error: null }));
    }

    try {
      const progressItems = await listMergedUserProgress(user.id);
      const startedItems = progressItems.filter(
        (progress) => deriveProgressStatus(progress) !== 'not_started',
      );

      if (startedItems.length === 0) {
        setState({ items: [], isLoading: false, error: null });
        return;
      }

      const programs = await listProgramsByIds(
        startedItems.map((progress) => progress.programId),
      );

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
      setState({
        items: [],
        isLoading: false,
        error: getFriendlyErrorMessage(error),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    ...state,
    isRefreshing,
    refetch: () => load(true),
  };
}
