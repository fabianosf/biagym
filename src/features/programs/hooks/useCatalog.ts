import type { ProgramSummary } from '@/domain';
import type { UserProgress } from '@/domain/progress';
import { useAuth } from '@/features/auth';
import { useCallback, useEffect, useState } from 'react';

import {
  listAccessiblePrograms,
  listMergedUserProgress,
  listPublishedPrograms,
} from '@/services';
import { getFriendlyErrorMessage } from '@/shared/errors';

type CatalogState = {
  catalog: ProgramSummary[];
  myItems: ProgramSummary[];
  progressByProgramId: Record<string, UserProgress>;
  isLoading: boolean;
  error: string | null;
};

export function useCatalog() {
  const { user } = useAuth();
  const [state, setState] = useState<CatalogState>({
    catalog: [],
    myItems: [],
    progressByProgramId: {},
    isLoading: true,
    error: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!user) {
      setState((current) => ({ ...current, isLoading: false }));
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setState((current) => ({ ...current, isLoading: true, error: null }));
    }

    try {
      const [catalog, myItems, progressItems] = await Promise.all([
        listPublishedPrograms(),
        listAccessiblePrograms(user.id),
        listMergedUserProgress(user.id),
      ]);

      const progressByProgramId = progressItems.reduce<Record<string, UserProgress>>(
        (accumulator, progress) => {
          accumulator[progress.programId] = progress;
          return accumulator;
        },
        {},
      );

      setState({
        catalog,
        myItems,
        progressByProgramId,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: getFriendlyErrorMessage(error),
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const myItemIds = new Set(state.myItems.map((program) => program.id));

  return {
    ...state,
    isRefreshing,
    myItemIds,
    refetch: () => load(true),
  };
}
