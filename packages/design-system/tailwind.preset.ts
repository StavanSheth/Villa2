/**
 * Villa Design System — Shared Tailwind Preset
 * 
 * Extends Tailwind with semantic color utilities mapped to CSS variables.
 * Each app extends this preset in their tailwind config:
 * 
 *   import villaPreset from '@villa-platform/design-system/tailwind.preset';
 *   export default { presets: [villaPreset], ... }
 */

import type { Config } from 'tailwindcss';

const villaPreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Core ── */
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        /* ── Card ── */
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        /* ── Muted ── */
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },

        /* ── Popover ── */
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },

        /* ── Primary (Gold) ── */
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },

        /* ── Accent ── */
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },

        /* ── Destructive ── */
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },

        /* ── Border & Ring ── */
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',

        /* ── Semantic Status ── */
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--danger-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },

        /* ── Gold Palette ── */
        gold: {
          DEFAULT: 'var(--gold-primary)',
          bright: 'var(--gold-bright)',
          soft: 'var(--gold-soft)',
          dark: 'var(--gold-dark)',
        },
      },

      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },

      boxShadow: {
        'villa-xs': 'var(--shadow-xs)',
        'villa-sm': 'var(--shadow-sm)',
        'villa-md': 'var(--shadow-md)',
        'villa-lg': 'var(--shadow-lg)',
        'villa-xl': 'var(--shadow-xl)',
        'villa-card': 'var(--shadow-card)',
        'villa-floating': 'var(--shadow-floating)',
        'gold-glow': 'var(--shadow-gold-glow)',
      },

      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },

      fontSize: {
        display: ['var(--text-display-size)', {
          lineHeight: 'var(--text-display-line-height)',
          letterSpacing: 'var(--text-display-letter-spacing)',
          fontWeight: 'var(--text-display-weight)',
        }],
        heading: ['var(--text-heading-size)', {
          lineHeight: 'var(--text-heading-line-height)',
          letterSpacing: 'var(--text-heading-letter-spacing)',
          fontWeight: 'var(--text-heading-weight)',
        }],
        subheading: ['var(--text-subheading-size)', {
          lineHeight: 'var(--text-subheading-line-height)',
          fontWeight: 'var(--text-subheading-weight)',
        }],
        body: ['var(--text-body-size)', {
          lineHeight: 'var(--text-body-line-height)',
          fontWeight: 'var(--text-body-weight)',
        }],
        caption: ['var(--text-caption-size)', {
          lineHeight: 'var(--text-caption-line-height)',
          letterSpacing: 'var(--text-caption-letter-spacing)',
          fontWeight: 'var(--text-caption-weight)',
        }],
        overline: ['var(--text-overline-size)', {
          lineHeight: 'var(--text-overline-line-height)',
          letterSpacing: 'var(--text-overline-letter-spacing)',
          fontWeight: 'var(--text-overline-weight)',
        }],
      },

      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
        theme: 'var(--duration-theme)',
      },

      transitionTimingFunction: {
        'out-expo': 'var(--ease-out)',
        'spring': 'var(--ease-spring)',
      },

      spacing: {
        'sidebar-expanded': 'var(--sidebar-width-expanded)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        'header': 'var(--header-height)',
      },

      animation: {
        'villa-fade-in': 'villa-fade-in 0.6s var(--ease-out) forwards',
        'villa-scale-in': 'villa-scale-in 0.5s var(--ease-out) forwards',
        'villa-slide-in': 'villa-slide-in-right 0.5s var(--ease-out) forwards',
      },
    },
  },
};

export default villaPreset;
