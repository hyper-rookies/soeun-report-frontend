/**
 * SE Report — Color tokens
 *
 * WHO:  Korean ad analysts checking Kakao/Google campaign performance at their desks.
 * FEEL: Analytical precision. Cool like a terminal, clear like a dashboard.
 *       Not casual like a chat app.
 *
 * STRATEGY:
 *   Foundation  → Cool slate (hsl 220–222°). Same hue throughout — lightness shifts only.
 *   Action      → Indigo (hsl 245°). Deeper authority than generic blue-500.
 *                 Kakao yellow (#FEE500) exists in data, not UI chrome.
 *   Borders     → Low-opacity rgba. Structure without visual noise.
 *   Semantics   → Same green/red signals as Google Ads / Kakao Moment dashboards.
 *
 * NOTE: These mirror the CSS custom properties defined in globals.css (@theme + :root).
 * Use CSS variables in components (bg-canvas, text-ink, border-[var(--bd)]).
 * Use these constants for documentation, tests, and non-Tailwind contexts.
 */

export const colors = {
  /**
   * Surfaces — cool slate
   * canvas → surface → overlay (ascending lightness)
   * well is the exception: inset, slightly darker, signals "type here"
   */
  surface: {
    canvas:   'hsl(220, 16%, 96%)',  // page background
    elevated: 'hsl(220, 18%, 99%)',  // cards, panels — whisper lighter than canvas
    overlay:  '#ffffff',             // modals, dropdowns — topmost surface
    well:     'hsl(220, 14%, 94%)',  // inset inputs — receives content
    ai:       'hsl(245, 30%, 98%)',  // AI message background — subtle indigo warmth
  },

  /**
   * Text hierarchy — four levels, each with a distinct role
   * Don't use only "text" and "gray text" — four levels build information density.
   */
  text: {
    ink:     'hsl(222, 25%, 10%)',  // primary — default content
    dim:     'hsl(222, 15%, 35%)',  // secondary — supporting, labels
    soft:    'hsl(222, 10%, 55%)',  // tertiary — metadata, timestamps, captions
    ghost:   'hsl(222, 8%,  72%)',  // muted — placeholder, disabled
    inverse: '#ffffff',             // text on dark/accent backgrounds
  },

  /**
   * Borders — rgba progression
   * Borders should disappear when you're not looking for them.
   * Low-opacity rgba blends with the background. Solid hex looks harsh.
   */
  border: {
    faint:   'rgba(100, 116, 139, 0.08)',  // softest — section grouping, ghost dividers
    default: 'rgba(100, 116, 139, 0.14)',  // standard separation
    strong:  'rgba(100, 116, 139, 0.28)',  // emphasis boundaries
    accent:  'hsl(245, 75%, 58%)',          // focus rings, AI message left marker
  },

  /**
   * Accent — indigo
   * Chosen for analytical authority over the standard blue-500 default.
   * This is a deliberate divergence from Kakao blue and Google blue.
   */
  accent: {
    default: 'hsl(245, 75%, 58%)',  // primary action
    dark:    'hsl(245, 75%, 50%)',  // hover state
    deeper:  'hsl(245, 75%, 44%)',  // active/pressed
    dim:     'hsl(245, 75%, 97%)',  // subtle accent background (badges, highlights)
    text:    '#ffffff',             // text on accent bg
  },

  /**
   * Semantic — performance signals
   * Green = positive delta, red = negative delta, yellow = caution.
   * Identical semantics to the ad dashboards this tool surfaces data from.
   */
  success: {
    default: 'hsl(158, 64%, 38%)',
    dim:     'hsl(158, 60%, 95%)',
    text:    'hsl(158, 64%, 28%)',
  },
  warning: {
    default: 'hsl(38, 92%, 48%)',
    dim:     'hsl(38, 90%, 95%)',
    text:    'hsl(38, 92%, 30%)',
  },
  destructive: {
    default: 'hsl(0, 72%, 52%)',
    dim:     'hsl(0, 70%, 96%)',
    text:    'hsl(0, 72%, 40%)',
  },
} as const;

export type ColorTokens = typeof colors;
