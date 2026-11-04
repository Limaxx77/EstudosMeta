/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: { 950: '#07080b', 900: '#0b0d12', 800: '#11141b', 700: '#181c25', 600: '#232836', 500: '#323949' },
        accent: { DEFAULT: '#2f80ff', soft: '#5b9dff', glow: '#1f6fff' },
        ok: '#22c55e',
        bad: '#ef4444',
        warn: '#eab308',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
        pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '60%': { transform: 'scale(1.04)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
        fall: { '0%': { transform: 'translateY(-10px) rotate(0)', opacity: '1' }, '100%': { transform: 'translateY(140px) rotate(320deg)', opacity: '0' } },
      },
      animation: {
        fadeUp: 'fadeUp .6s ease both',
        pop: 'pop .5s ease both',
        fall: 'fall 1.6s ease-in forwards',
      },
    },
  },
  plugins: [],
};
