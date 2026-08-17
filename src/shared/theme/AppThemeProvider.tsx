import { vars } from 'nativewind';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { translate } from '@/shared/i18n';
import { palettes, type ColorPalette } from './palettes';
import {
  resolveColorScheme,
  subscribeSystemAppearance,
  usePreferencesStore,
  type ColorSchemeName,
} from './preferences.store';

const themeVars = {
  light: vars({
    '--color-background': palettes.light.background,
    '--color-surface': palettes.light.surface,
    '--color-elevated': palettes.light.elevated,
    '--color-ink': palettes.light.ink,
    '--color-muted': palettes.light.muted,
    '--color-faint': palettes.light.faint,
    '--color-line': palettes.light.line,
  }),
  dark: vars({
    '--color-background': palettes.dark.background,
    '--color-surface': palettes.dark.surface,
    '--color-elevated': palettes.dark.elevated,
    '--color-ink': palettes.dark.ink,
    '--color-muted': palettes.dark.muted,
    '--color-faint': palettes.dark.faint,
    '--color-line': palettes.dark.line,
  }),
};

export function useResolvedColorScheme(): ColorSchemeName {
  const appearance = usePreferencesStore((state) => state.appearance);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(() =>
    resolveColorScheme('system'),
  );

  useEffect(() => {
    return subscribeSystemAppearance(setSystemScheme);
  }, []);

  return appearance === 'system' ? systemScheme : appearance;
}

export function useThemeColors(): ColorPalette {
  const scheme = useResolvedColorScheme();
  return palettes[scheme];
}

export function useT() {
  const locale = usePreferencesStore((state) => state.locale);
  return useMemo(
    () => (key: string, vars?: Record<string, string>) => translate(locale, key, vars),
    [locale],
  );
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useResolvedColorScheme();
  const palette = palettes[scheme];

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.background);
  }, [palette.background]);

  return (
    <View className="flex-1" style={[{ backgroundColor: palette.background }, themeVars[scheme]]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
