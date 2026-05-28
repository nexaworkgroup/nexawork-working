import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-green':      '#1A7A4A',
        'brand-green-dark': '#145E38',
        'brand-green-light':'#E8F5EF',
        'brand-gold':       '#E8B84B',
        'brand-gold-light': '#FEF3C7',
        'brand-gold-dark':  '#92400E',
        'surface':          'var(--surface)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(26,122,74,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        'modal':      '0 20px 60px rgba(0,0,0,0.15)',
        'green':      '0 4px 12px rgba(26,122,74,0.3)',
        'gold':       '0 4px 12px rgba(232,184,75,0.4)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'scale-in':   'scaleIn 0.2s ease forwards',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'spin-slow':  'spin 3s linear infinite',
        'pulse-ring': 'pulse-ring 2s infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity:'0', transform:'translateY(8px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideUp:    { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        scaleIn:    { from: { opacity:'0', transform:'scale(0.95)' }, to: { opacity:'1', transform:'scale(1)' } },
        float:      { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-4px)' } },
        shimmer:    { '0%': { backgroundPosition:'200% 0' }, '100%': { backgroundPosition:'-200% 0' } },
        'pulse-ring': {
          '0%':   { boxShadow:'0 0 0 0 rgba(26,122,74,0.4)' },
          '70%':  { boxShadow:'0 0 0 8px rgba(26,122,74,0)' },
          '100%': { boxShadow:'0 0 0 0 rgba(26,122,74,0)' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
} satisfies Config
