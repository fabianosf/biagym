import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const EMPTY_TRAINER = {
  favoriteIds: [] as string[],
  lastOpenedAt: {} as Record<string, number>,
};

type TrainerPins = {
  favoriteIds: string[];
  lastOpenedAt: Record<string, number>;
};

type StudentPinsState = {
  byTrainerId: Record<string, TrainerPins>;
  toggleFavorite: (trainerId: string, studentId: string) => void;
  markOpened: (trainerId: string, studentId: string) => void;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
};

export const useStudentPinsStore = create<StudentPinsState>()(
  persist(
    (set) => ({
      byTrainerId: {},
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      toggleFavorite: (trainerId, studentId) =>
        set((state) => {
          const current = state.byTrainerId[trainerId] ?? EMPTY_TRAINER;
          const isFav = current.favoriteIds.includes(studentId);
          return {
            byTrainerId: {
              ...state.byTrainerId,
              [trainerId]: {
                ...current,
                favoriteIds: isFav
                  ? current.favoriteIds.filter((id) => id !== studentId)
                  : [studentId, ...current.favoriteIds],
              },
            },
          };
        }),
      markOpened: (trainerId, studentId) =>
        set((state) => {
          const current = state.byTrainerId[trainerId] ?? EMPTY_TRAINER;
          return {
            byTrainerId: {
              ...state.byTrainerId,
              [trainerId]: {
                ...current,
                lastOpenedAt: {
                  ...current.lastOpenedAt,
                  [studentId]: Date.now(),
                },
              },
            },
          };
        }),
    }),
    {
      name: 'biagym-student-pins',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ byTrainerId: state.byTrainerId }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function getTrainerPins(byTrainerId: Record<string, TrainerPins>, trainerId?: string): TrainerPins {
  if (!trainerId) {
    return EMPTY_TRAINER;
  }

  return byTrainerId[trainerId] ?? EMPTY_TRAINER;
}
