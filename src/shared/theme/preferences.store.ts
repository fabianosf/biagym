import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AppLocale } from '@/shared/i18n';

export type AppearancePreference = 'light' | 'dark' | 'system';
export type ColorSchemeName = 'light' | 'dark';

function readSystemScheme(): ColorSchemeName {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

type PreferencesState = {
  appearance: AppearancePreference;
  locale: AppLocale;
  hasHydrated: boolean;
  setAppearance: (appearance: AppearancePreference) => void;
  setLocale: (locale: AppLocale) => void;
  setHasHydrated: (value: boolean) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      appearance: 'system',
      locale: 'pt-BR',
      hasHydrated: false,
      setAppearance: (appearance) => set({ appearance }),
      setLocale: (locale) => set({ locale }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'biagym-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        appearance: state.appearance,
        locale: state.locale,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function resolveColorScheme(appearance: AppearancePreference): ColorSchemeName {
  if (appearance === 'system') {
    return readSystemScheme();
  }

  return appearance;
}

export function subscribeSystemAppearance(onChange: (scheme: ColorSchemeName) => void): () => void {
  const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    onChange(colorScheme === 'dark' ? 'dark' : 'light');
  });
  return () => subscription.remove();
}
