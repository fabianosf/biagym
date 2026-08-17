/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F6F6F6',
        elevated: '#FFFFFF',
        ink: '#1A1A1A',
        muted: '#6F6F6F',
        faint: '#9B9B9B',
        line: '#ECECEC',
        cyan: '#2F6FED',
        gym: '#0C0C0E',
        gymCard: '#161618',
        gymLine: '#2A2A2E',
        gymMuted: '#A1A1AA',
        primary: {
          DEFAULT: '#E8573A',
          dark: '#C43E25',
          muted: '#F07A63',
        },
      },
      borderRadius: {
        card: '18px',
      },
    },
  },
  plugins: [],
};
