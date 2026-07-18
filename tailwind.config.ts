import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        'background-dark': '#000000',
        surface: '#FFFFFF',
        'surface-dark': '#111111',
        accent: '#0066FF',
        'accent-hover': '#0052CC',
        'text-primary': '#000000',
        'text-muted': '#666666',
        border: '#000000',
        'graph-bg': '#000000',
        success: '#2D6A4F',
        warning: '#B45309',
        danger: '#FF0000',
        'admin-bg': '#FFFFFF',
        'admin-bg-dark': '#000000',
      },
      fontFamily: {
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        full: '9999px',
      },
      boxShadow: {
        DEFAULT: 'none',
        sm: 'none',
        md: 'none',
        'impact': '4px 4px 0px 0px #000000',
      },
      lineHeight: {
        tight: '1.1',
        display: '1.05',
        body: '1.6',
      },
      fontSize: {
        display: ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.75rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'card-title': ['1.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'card-body': ['1rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
};

export default config;
