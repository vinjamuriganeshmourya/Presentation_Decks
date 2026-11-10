import type { Config } from 'tailwindcss'

/**
 * "NxtWave Evolve" — an original educational design theme.
 *
 * The PPTX is used only as a *structural* reference (which slide types
 * exist). Colours, characters, typography and layout are all new and
 * tuned for educational content delivery: high legibility, a calm
 * trustworthy primary, an energetic accent for emphasis/CTAs, and clear
 * semantic colours for callouts.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /*
          Primary — the NxtWave style guide's blue, as a full ramp.

          This ramp used to be built on the Evolve blue #0B5FFF while the chrome
          slides used the style guide's #2D63FB out of the `nw` group below. The
          two are close enough to look like a rendering error and far enough
          apart to be obvious the moment a light content slide follows a navy
          divider: the kicker tick, the icons and the chips all shifted hue.

          So the ramp is retargeted rather than the ~30 slides that consume it.
          500/600/900 are now exactly `nw.blue` / `nw.deep` / `nw.navy`; the
          `nw` group is kept as the *names* the style guide uses for those same
          stops, so both spellings resolve to one colour.
        */
        brand: {
          50: '#EEF3FF',
          100: '#D9E4FF',
          200: '#B4C8FF',
          300: '#86A5FF',
          400: '#5482FD',
          500: '#2D63FB', // PRIMARY — nw.blue
          600: '#0146C7', //           nw.deep
          700: '#013A9E',
          800: '#002E7A',
          900: '#00254B', //           nw.navy
          DEFAULT: '#2D63FB',
        },
        teal: {
          50: '#E6FAF7',
          100: '#C7F2EC',
          300: '#6FD9CE',
          400: '#33C6B7',
          500: '#12B5A8', // SECONDARY
          600: '#0E9285',
          700: '#0B6F66',
          DEFAULT: '#12B5A8',
        },
        accent: {
          50: '#FFF2E8',
          100: '#FFE1CC',
          300: '#FFB585',
          400: '#FF9E5C',
          500: '#FF8A3D', // ACCENT
          600: '#E5732A',
          700: '#B9591E',
          DEFAULT: '#FF8A3D',
        },
        success: { DEFAULT: '#16A34A', 100: '#DCFCE7', 600: '#15803D' },
        warning: { DEFAULT: '#F59E0B', 100: '#FEF3C7', 600: '#B45309' },
        danger: { DEFAULT: '#EF4444', 100: '#FEE2E2', 600: '#B91C1C' },
        info: { DEFAULT: '#0EA5E9', 100: '#E0F2FE', 600: '#0369A1' },
        ink: {
          DEFAULT: '#002A4B', // the updated template's navy (user, 2026-10-12; base template 2026-10-14)
          soft: '#002A4B',
        },
        body: {
          DEFAULT: '#002A4B', // body text is the same navy (user, 2026-10-12)
          soft: '#002A4B',
        },
        muted: '#6B7F95', // COLOURS (Cloud Computing Fundamentals, 2026-10-22): mirrors tokens.ts, session-local
        line: '#CFDCF5',
        surface: {
          DEFAULT: '#F4F8FF',
          2: '#E8F0FF',
          card: '#FFFFFF',
        },
        night: {
          DEFAULT: '#081026', // dark section-slide base
          2: '#0C1A3A',
          3: '#122554',
        },
        /*
          NXTWAVE PPT STYLE GUIDE — page 01, Colors.
          The official deck palette, kept as its own group rather than folded
          into `brand`: the two are different blues (#2D63FB against #0B5FFF)
          and mixing them on one slide reads as a mistake. Opening frames use
          this group; the rest of the deck still uses the Evolve theme above.
        */
        nw: {
          navy: '#00254B',   // primary, deep
          blue: '#2D63FB',   // primary, brand blue
          deep: '#0146C7',   // secondary, and the background blue
          black: '#1C1C1C',  // secondary, and all heading/body text
        },
      },
      fontFamily: {
        /* THE UPDATED TEMPLATE'S FONT SHEET (user, 2026-10-12; the base template since 2026-10-14; content rule 34). `heading` and
           `body` are both DM Sans (Medium for body, SemiBold for headings, see
           fontWeight below); `mono` is Fira Code; `tpl-title` is Sora SemiBold for
           session and section titles and hero words; `term` is Ubuntu Mono for
           the title bar of a code or terminal window. */
        heading: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
        'tpl-title': ['Sora', 'system-ui', 'sans-serif'],
        'tpl-body': ['"DM Sans"', 'system-ui', 'sans-serif'],
        term: ['"Ubuntu Mono"', 'ui-monospace', 'monospace'],
      },
      /* Two weights only, Medium and SemiBold: every lighter class is Medium, every heavier one SemiBold. */
      fontWeight: {
        thin: '500', extralight: '500', light: '500', normal: '500', medium: '500',
        semibold: '600', bold: '600', extrabold: '600', black: '600',
      },
      /* Type scale locked to the 1280×720 slide canvas (fixed px). */
      fontSize: {
        /* The kicker: 22px title case at 0.02em, Medium (user, 2026-10-13); was 15px capitals at 0.14em, bold. */
        kicker: ['22px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '500' }],
        'slide-title': ['34px', { lineHeight: '1.12', fontWeight: '600' }],
        'slide-title-lg': ['44px', { lineHeight: '1.08', fontWeight: '600' }],
        hero: ['64px', { lineHeight: '1.02', fontWeight: '600' }],
        'body-xl': ['26px', { lineHeight: '1.45' }],
        'body-lg': ['22px', { lineHeight: '1.5' }],
        body: ['19px', { lineHeight: '1.6' }],
        'body-sm': ['16px', { lineHeight: '1.55' }],
        code: ['17px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        card: '18px',
        xl2: '24px',
        pill: '999px',
      },
      boxShadow: {
        /* Blue-tinted, and the blue is the style guide's #2D63FB. */
        card: '0 10px 34px -14px rgba(45, 99, 251, 0.30)',
        'card-soft': '0 6px 24px -10px rgba(0, 37, 75, 0.16)',
        float: '0 26px 70px -24px rgba(45, 99, 251, 0.50)',
        glow: '0 0 0 6px rgba(45, 99, 251, 0.10)',
      },
      backgroundImage: {
        /* Retired: Evolve blue into teal. `bg-nw-gradient` replaced it. */
        'brand-gradient': 'linear-gradient(135deg, #2D63FB 0%, #1B54E4 55%, #0146C7 100%)',
        /* The light content ground, tinted by the new blue rather than the old. */
        'brand-soft': 'linear-gradient(160deg, #EEF3FF 0%, #F5F8FF 100%)',
        'accent-gradient': 'linear-gradient(135deg, #FF8A3D 0%, #FFB055 100%)',
        'night-gradient': 'radial-gradient(120% 120% at 15% 0%, #122554 0%, #0C1A3A 45%, #081026 100%)',
        'teal-gradient': 'linear-gradient(135deg, #12B5A8 0%, #0B5FFF 130%)',
        /* Style guide, page 01: the brand gradient, #2D63FB into #0146C7. */
        'nw-gradient': 'linear-gradient(135deg, #2D63FB 0%, #1B54E4 55%, #0146C7 100%)',
        'nw-gradient-deep': 'linear-gradient(140deg, #0146C7 0%, #00254B 100%)',
        /* The deep stage: the style guide's navy primary carrying its deep blue,
           for the opening frames that want depth rather than saturation. */
        'nw-night': 'radial-gradient(120% 120% at 18% 0%, #0146C7 0%, #013A86 42%, #00254B 100%)',
      },
      keyframes: {
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'float-y': 'float-y 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.6s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
