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
        'graph-bg': '#FFFFFF',
        success: '#2D6A4F',
        warning: '#B45309',
        danger: '#FF0000',
        'admin-bg': '#FFFFFF',
        'admin-bg-dark': '#000000',
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Georgia', 'serif'],
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
        // The hover state for anything carrying `shadow-impact`. Paired with a
        // 2px translate up-and-left, so the element appears to rise off the page
        // while its cast shadow lengthens — the only elevation move that is
        // honest in a design system with no blur and no gradients.
        'impact-lg': '7px 7px 0px 0px #000000',
      },
      lineHeight: {
        tight: '1.1',
        display: '1.05',
        body: '1.6',
      },
      /**
       * Motion tokens. Every transition on the marketing surface uses `ease-tm`
       * and one of the three durations below — a single easing curve applied
       * consistently is what separates a site that feels engineered from one
       * that feels assembled. The curve starts instantly and spends most of its
       * time decelerating, so movement reads as weighted rather than mechanical.
       *
       * The three tiers exist so that scale of movement and duration stay
       * correlated: a colour swap must not take as long as a panel reveal.
       */
      transitionTimingFunction: {
        tm: 'cubic-bezier(0, 0, 0.3642, 1)',
      },
      transitionDuration: {
        // Tier 1 — colour and opacity only.
        fast: '200ms',
        // Tier 2 — the default: transforms, borders, shadows, backgrounds.
        base: '400ms',
        // Tier 3 — reveals and anything that crosses a large distance.
        slow: '600ms',
      },
      keyframes: {
        /**
         * Ambient drift for the decorative hero layers. Long, linear and
         * alternating, so there is always slow movement behind the content
         * without anything ever arriving or departing.
         */
        'tm-float': {
          '0%, 100%': { transform: 'translateY(calc(var(--tm-float, 24px) * -1))' },
          '50%': { transform: 'translateY(var(--tm-float, 24px))' },
        },
      },
      animation: {
        'tm-float': 'tm-float var(--tm-dur, 14s) ease-in-out infinite',
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
