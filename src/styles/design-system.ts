/**
 * SE Report — Design System
 *
 * ─── PRODUCT ────────────────────────────────────────────────────────────────
 * AI-powered ad analytics for Korean marketers.
 * Natural language → SQL → Kakao/Google campaign data.
 *
 * ─── WHO ────────────────────────────────────────────────────────────────────
 * Marketing analysts, during business hours, accountable for ad spend.
 * Not developers. Not casual users. People who need numbers to tell a story.
 *
 * ─── FEEL ───────────────────────────────────────────────────────────────────
 * "Dense enough to be taken seriously. Clear enough to trust the numbers."
 * Bloomberg terminal meets a smart analyst colleague.
 * Not a chat toy — a thinking instrument.
 *
 * ─── DECISIONS ──────────────────────────────────────────────────────────────
 *
 * Palette:
 *   Cool slate (hsl 220°) foundation. Same hue family throughout — only lightness shifts.
 *   Indigo-600 (hsl 245°) for action. Deeper authority than generic blue-500.
 *   Kakao yellow (#FEE500) lives in data, not UI chrome.
 *   Semantic green/red matches the ad dashboards users already know.
 *
 * Depth:
 *   Borders-only. No box-shadows.
 *   Low-opacity rgba defines structure without visual noise.
 *   Hierarchy emerges from surface lightness shifts + border opacity.
 *
 * Surfaces:
 *   canvas (96%) → surface (99%) → overlay (100%)
 *   well (94%) — inset, darker, signals "type here"
 *   surface-ai — subtle indigo tint for AI output
 *
 * Typography:
 *   Inter — precise, trustworthy, legible at dense sizes.
 *   Four text levels: ink / ink-dim / ink-soft / ink-ghost.
 *   Monospace for data, numbers, and SQL.
 *   Tight letter-spacing on headings (-0.02em).
 *
 * Spacing: 4px base. Every value is a multiple. Nothing random.
 *
 * AI Messages (signature element):
 *   Document-style, not bubbles. Indigo left border (3px).
 *   Subtle surface-ai background.
 *   Monospace treatment for numbers and SQL fragments.
 *   Clearly distinct from user queries.
 *
 * ─── REJECTION OF DEFAULTS ──────────────────────────────────────────────────
 *   Chat bubbles for everything → Document-style AI output
 *   blue-500 action color       → indigo-600 (same family, deeper authority)
 *   Emoji in UI chrome          → Clean text + coherent icon system
 */

export { colors } from './colors';
export { spacing, radius } from './spacing';

export const typography = {
  fontFamily: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, 'JetBrains Mono', 'Fira Code', monospace",
  },

  /**
   * Type scale — four levels, each with a distinct role
   * Combine size + weight + letter-spacing. Don't rely on size alone.
   */
  scale: {
    heading: {
      xl: { fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em',  lineHeight: '1.25' },
      lg: { fontSize: '17px', fontWeight: '600', letterSpacing: '-0.015em', lineHeight: '1.3'  },
      md: { fontSize: '14px', fontWeight: '600', letterSpacing: '-0.01em',  lineHeight: '1.4'  },
    },
    body: {
      md: { fontSize: '14px', fontWeight: '400', letterSpacing: '0',        lineHeight: '1.6'  },
      sm: { fontSize: '13px', fontWeight: '400', letterSpacing: '0',        lineHeight: '1.5'  },
    },
    label: {
      md: { fontSize: '13px', fontWeight: '500', letterSpacing: '0.01em',   lineHeight: '1.4'  },
      sm: { fontSize: '11px', fontWeight: '500', letterSpacing: '0.03em',   lineHeight: '1.3'  },
    },
    /** Tabular nums for data alignment — never skip this for numbers */
    data: {
      md: { fontSize: '13px', fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', lineHeight: '1.4' },
      sm: { fontSize: '11px', fontFamily: 'mono', fontVariantNumeric: 'tabular-nums', lineHeight: '1.3' },
    },
  },
} as const;

export const depth = {
  /**
   * Strategy: borders-only
   *
   * No box-shadows. Hierarchy via:
   *   1. Surface lightness shifts (canvas 96% → surface 99% → overlay 100%)
   *   2. Low-opacity rgba borders (faint 8% → default 14% → strong 28%)
   *
   * This is what separates professional interfaces from amateur ones.
   * Get this wrong and nothing else matters.
   */
  strategy: 'borders-only' as const,

  elevation: {
    canvas:  0,   // page background — lowest
    surface: 1,   // cards, panels
    overlay: 2,   // dropdowns, modals — topmost
    well:   -1,   // inputs — inset, darker, receives content
  },

  /**
   * Border scale
   * Build a progression — not all borders are equal.
   * Match intensity to the importance of the boundary.
   */
  borders: {
    faint:   { opacity: 0.08, usage: 'Section grouping, ghost dividers' },
    default: { opacity: 0.14, usage: 'Standard component separation'    },
    strong:  { opacity: 0.28, usage: 'Emphasis boundaries'              },
    accent:  { color: 'hsl(245, 75%, 58%)', usage: 'Focus rings, AI message marker' },
  },
} as const;

export type DesignSystem = {
  typography: typeof typography;
  depth: typeof depth;
};
