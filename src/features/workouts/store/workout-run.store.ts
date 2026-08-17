import { create } from 'zustand';

type WorkoutRunState = {
  completedByPlanId: Record<string, readonly string[]>;
  startedAtByPlanId: Record<string, number>;
  loadByItemId: Record<string, number>;
  ensureStarted: (planId: string) => void;
  setItemLoad: (itemId: string, loadKg: number) => void;
  markCompleted: (planId: string, exerciseId: string) => void;
  unmark: (planId: string, exerciseId: string) => void;
  clearPlan: (planId: string) => void;
};

export const useWorkoutRunStore = create<WorkoutRunState>((set) => ({
  completedByPlanId: {},
  startedAtByPlanId: {},
  loadByItemId: {},
  ensureStarted: (planId) =>
    set((state) => {
      if (state.startedAtByPlanId[planId]) {
        return state;
      }

      return {
        startedAtByPlanId: {
          ...state.startedAtByPlanId,
          [planId]: Date.now(),
        },
      };
    }),
  setItemLoad: (itemId, loadKg) =>
    set((state) => ({
      loadByItemId: {
        ...state.loadByItemId,
        [itemId]: loadKg,
      },
    })),
  markCompleted: (planId, exerciseId) =>
    set((state) => {
      const current = state.completedByPlanId[planId] ?? [];
      if (current.includes(exerciseId)) {
        return state;
      }

      return {
        completedByPlanId: {
          ...state.completedByPlanId,
          [planId]: [...current, exerciseId],
        },
      };
    }),
  unmark: (planId, exerciseId) =>
    set((state) => ({
      completedByPlanId: {
        ...state.completedByPlanId,
        [planId]: (state.completedByPlanId[planId] ?? []).filter((id) => id !== exerciseId),
      },
    })),
  clearPlan: (planId) =>
    set((state) => {
      const nextCompleted = { ...state.completedByPlanId };
      const nextStarted = { ...state.startedAtByPlanId };
      delete nextCompleted[planId];
      delete nextStarted[planId];
      return {
        completedByPlanId: nextCompleted,
        startedAtByPlanId: nextStarted,
      };
    }),
}));
