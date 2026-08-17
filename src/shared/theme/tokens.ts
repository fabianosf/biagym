import { lightPalette } from './palettes';

/** Paleta clara padrão. Telas que precisam seguir o tema devem usar `useThemeColors`. */
export const colors = lightPalette;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const spacing = {
  screen: 20,
  section: 28,
  card: 16,
} as const;

export const gradients = {
  splash: [colors.gym, '#0B2218', colors.gym] as const,
  hero: ['transparent', 'rgba(7,20,15,0.2)', 'rgba(7,20,15,0.82)'] as const,
  card: [colors.elevated, colors.surface] as const,
  primary: [colors.primary, colors.primaryDark] as const,
} as const;
