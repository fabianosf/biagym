import type { ProgramDetail } from '@/domain/program';
import type { UserProgress } from '@/domain/progress';
import { useAuth } from '@/features/auth';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DATA_FETCH_TIMEOUT_MS,
  getMergedProgramProgress,
  getProgramDetail,
  userHasProgramAccess,
  withTimeout,
} from '@/services';
import { getFriendlyErrorMessage } from '@/shared/errors';

type ProgramDetailState = {
  detail: ProgramDetail | null;
  progress: UserProgress | null;
  hasAccess: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

const INITIAL_STATE: ProgramDetailState = {
  detail: null,
  progress: null,
  hasAccess: false,
  isLoading: true,
  isRefreshing: false,
  error: null,
};

export function useProgramDetail(programId: string | undefined) {
  const { user, isInitialized, isAdmin } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<ProgramDetailState>(INITIAL_STATE);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (isRefresh = false) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const isStale = () => requestId !== requestIdRef.current;

      if (!isInitialized) {
        return;
      }

      if (!programId) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          error: 'Identificador do programa inválido.',
        });
        return;
      }

      if (!userId) {
        setState({
          ...INITIAL_STATE,
          isLoading: false,
          error: 'Faça login para abrir este programa.',
        });
        return;
      }

      if (isRefresh) {
        setState((current) => ({ ...current, isRefreshing: true, error: null }));
      } else {
        setState((current) => ({
          ...current,
          isLoading: current.detail ? false : true,
          isRefreshing: Boolean(current.detail),
          error: null,
        }));
      }

      try {
        const [detailResult, progressResult, accessResult] = await withTimeout(
          Promise.allSettled([
            getProgramDetail(programId),
            getMergedProgramProgress(userId, programId),
            userHasProgramAccess(userId, programId),
          ]),
          DATA_FETCH_TIMEOUT_MS,
          'O carregamento do programa demorou demais. Tente novamente.',
        );

        if (isStale()) {
          return;
        }

        if (detailResult.status === 'rejected') {
          throw detailResult.reason;
        }

        const detail = detailResult.value;
        const progress =
          progressResult.status === 'fulfilled' ? progressResult.value : null;
        const hasAccess =
          isAdmin || (accessResult.status === 'fulfilled' ? accessResult.value : false);

        if (!detail) {
          setState({
            detail: null,
            progress,
            hasAccess,
            isLoading: false,
            isRefreshing: false,
            error: 'Programa não encontrado.',
          });
          return;
        }

        setState({
          detail,
          progress,
          hasAccess,
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
      } catch (error) {
        if (isStale()) {
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getFriendlyErrorMessage(error),
        }));
      }
    },
    [isInitialized, programId, userId, isAdmin],
  );

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

  const setProgress = useCallback((progress: UserProgress) => {
    setState((current) => ({ ...current, progress }));
  }, []);

  const refetch = useCallback(() => load(true), [load]);

  return {
    ...state,
    refetch,
    setProgress,
  };
}
