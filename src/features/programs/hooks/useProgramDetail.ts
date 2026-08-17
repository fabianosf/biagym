import type { ProgramDetail } from '@/domain/program';
import type { UserProgress } from '@/domain/progress';
import { useAuth } from '@/features/auth';
import { useCallback, useEffect, useState } from 'react';

import {
  getMergedProgramProgress,
  getProgramDetail,
  userHasProgramAccess,
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

export function useProgramDetail(programId: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<ProgramDetailState>({
    detail: null,
    progress: null,
    hasAccess: false,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const load = useCallback(
    async (isRefresh = false) => {
      if (!programId || !user) {
        setState((current) => ({ ...current, isLoading: false }));
        return;
      }

      if (isRefresh) {
        setState((current) => ({ ...current, isRefreshing: true, error: null }));
      } else {
        setState((current) => ({ ...current, isLoading: true, error: null }));
      }

      try {
        const [detail, progress, hasAccess] = await Promise.all([
          getProgramDetail(programId),
          getMergedProgramProgress(user.id, programId),
          userHasProgramAccess(user.id, programId),
        ]);

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
        setState((current) => ({
          ...current,
          isLoading: false,
          isRefreshing: false,
          error: getFriendlyErrorMessage(error),
        }));
      }
    },
    [programId, user],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const setProgress = useCallback((progress: UserProgress) => {
    setState((current) => ({ ...current, progress }));
  }, []);

  return {
    ...state,
    refetch: () => load(true),
    setProgress,
  };
}
