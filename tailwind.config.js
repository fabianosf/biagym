/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background, #F4F8F6)',
        surface: 'var(--color-surface, #E7EFEA)',
        elevated: 'var(--color-elevated, #FFFFFF)',
        ink: 'var(--color-ink, #0A1A14)',
        muted: 'var(--color-muted, #5B6F66)',
        faint: 'var(--color-faint, #8BA396)',
        line: 'var(--color-line, #D7E4DC)',
        cyan: '#0D9488',
        gym: '#050505',
        gymCard: '#171717',
        gymLine: '#2A2A2A',
        gymMuted: '#A3A3A3',
        gymAccent: '#F5C400',
        gymOnAccent: '#111111',
        primary: {
          DEFAULT: '#10B981',
          dark: '#047857',
          muted: '#34D399',
        },
      },
      borderRadius: {
        card: '18px',
      },
    },
  },
  plugins: [],
};
