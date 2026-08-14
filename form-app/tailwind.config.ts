import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#242424',
          surface: '#2E2E2E',
          'surface-hover': '#363636',
          accent: '#00B4C8',
          'accent-dark': '#0099AA',
          border: '#404040',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
