/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      maxWidth: { app: '430px' },
      colors: {
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-2': 'var(--border-2)',
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        secondary: 'var(--secondary)',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease both',
        'shimmer': 'shimmer 1.6s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.25s ease both',
        'slide-in-left': 'slideInLeft 0.25s ease both',
        'scale-in': 'scaleIn 0.2s ease both',
        'toast-in': 'toastIn 0.3s ease both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px 2px rgba(124,58,237,0.4)' },
          '50%': { boxShadow: '0 0 24px 6px rgba(124,58,237,0.7)' },
        },
        typing: {
          '0%, 80%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '40%': { transform: 'scale(1.4)', opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.93)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
