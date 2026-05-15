import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1A7A4A',
          'green-light': '#E8F5EE',
          'green-dark': '#145E38',
          gold: '#E8B84B',
          'gold-light': '#FEF9EC',
          'gold-dark': '#C9993A',
        },
        surface: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10)',
      }
    }
  },
  plugins: []
} satisfies Config
