export type ColorPalette = {
  background: string;
  surface: string;
  elevated: string;
  overlay: string;
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  cyan: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  danger: string;
  warning: string;
  onPrimary: string;
  gym: string;
  gymCard: string;
  gymLine: string;
  gymMuted: string;
  gymAccent: string;
  gymOnAccent: string;
};

export const lightPalette: ColorPalette = {
  background: '#F4F8F6',
  surface: '#E7EFEA',
  elevated: '#FFFFFF',
  overlay: '#07140F',
  primary: '#10B981',
  primaryDark: '#047857',
  primaryMuted: '#34D399',
  cyan: '#0D9488',
  ink: '#0A1A14',
  muted: '#5B6F66',
  faint: '#8BA396',
  line: '#D7E4DC',
  danger: '#E11D48',
  warning: '#D97706',
  onPrimary: '#FFFFFF',
  gym: '#050505',
  gymCard: '#171717',
  gymLine: '#2A2A2A',
  gymMuted: '#A3A3A3',
  gymAccent: '#F5C400',
  gymOnAccent: '#111111',
};

export const darkPalette: ColorPalette = {
  background: '#07140F',
  surface: '#12201A',
  elevated: '#1A2A23',
  overlay: '#020805',
  primary: '#34D399',
  primaryDark: '#10B981',
  primaryMuted: '#6EE7B7',
  cyan: '#2DD4BF',
  ink: '#F3FBF7',
  muted: '#A8C0B6',
  faint: '#7F9A90',
  line: '#2C453B',
  danger: '#FB7185',
  warning: '#FBBF24',
  onPrimary: '#062015',
  gym: '#050505',
  gymCard: '#171717',
  gymLine: '#2A2A2A',
  gymMuted: '#A3A3A3',
  gymAccent: '#F5C400',
  gymOnAccent: '#111111',
};

export const palettes = {
  light: lightPalette,
  dark: darkPalette,
} as const;
