/** Visual tokens aligned with the student fitness reference (light UI, coral accent). */

export const colors = {
  background: '#FFFFFF',
  surface: '#F6F6F6',
  elevated: '#FFFFFF',
  overlay: '#111111',
  primary: '#E8573A',
  primaryMuted: '#F07A63',
  cyan: '#2F6FED',
  ink: '#1A1A1A',
  muted: '#6F6F6F',
  faint: '#9B9B9B',
  line: '#ECECEC',
  danger: '#E11D48',
  warning: '#D97706',
  onPrimary: '#FFFFFF',
} as const;

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
  splash: [colors.background, '#FFF3EF', colors.background] as const,
  hero: ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)'] as const,
  card: [colors.elevated, colors.surface] as const,
  primary: [colors.primary, colors.primaryMuted] as const,
} as const;
