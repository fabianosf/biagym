import type { ProgramSummary } from '@/domain';
import type { UserProgress } from '@/domain/progress';
import { useAuth } from '@/features/auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DATA_FETCH_TIMEOUT_MS,
  listAccessiblePrograms,
  listMergedUserProgress,
  listPublishedPrograms,
  withTimeout,
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
  const { user, isInitialized } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<CatalogState>({
    catalog: [],
    myItems: [],
    progressByProgramId: {},
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
      setState({
        catalog: [],
        myItems: [],
        progressByProgramId: {},
        isLoading: false,
        error: null,
      });
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setState((current) => ({ ...current, isLoading: true, error: null }));
    }

    try {
      const [catalog, myItems, progressItems] = await withTimeout(
        Promise.all([
          listPublishedPrograms(),
          listAccessiblePrograms(userId),
          listMergedUserProgress(userId),
        ]),
        DATA_FETCH_TIMEOUT_MS,
        'O catálogo demorou demais para carregar. Tente novamente.',
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

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
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: false,
        error: getFriendlyErrorMessage(error),
      }));
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

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setState((current) =>
        current.isLoading
          ? {
              ...current,
              isLoading: false,
              error: 'Não foi possível iniciar a sessão. Feche e abra o aplicativo novamente.',
            }
          : current,
      );
    }, DATA_FETCH_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [isInitialized]);

  const myItemIds = useMemo(
    () => new Set(state.myItems.map((program) => program.id)),
    [state.myItems],
  );
  const refetch = useCallback(() => load(true), [load]);

  return {
    ...state,
    isRefreshing,
    myItemIds,
    refetch,
  };
}
