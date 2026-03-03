/**
 * SE Report — Spacing & radius tokens
 *
 * SPACING: 4px base unit. Every value is a multiple.
 * Random values signal no system. On-grid values compound into consistency.
 *
 * RADIUS: Sharper = more technical. Rounder = more approachable.
 * This product sits in the technical half — tight radii, not soft pills.
 */

export const spacing = {
  0:    '0px',
  0.5:  '2px',   // hairline gaps
  1:    '4px',   // micro — icon gaps, tight pairs
  1.5:  '6px',
  2:    '8px',   // compact — badge padding, small gaps
  2.5:  '10px',
  3:    '12px',  // component — button vertical padding, list item gaps
  4:    '16px',  // standard — card padding, section gaps
  5:    '20px',
  6:    '24px',  // generous — between grouped sections
  7:    '28px',
  8:    '32px',  // layout — major section spacing
  10:   '40px',
  12:   '48px',  // structural — page-level margins
  16:   '64px',
  20:   '80px',
} as const;

export const radius = {
  sm:   '4px',      // inputs, tags, small badges — technical, tight
  md:   '6px',      // buttons, controls
  lg:   '8px',      // cards, panels, popovers
  xl:   '12px',     // modals, larger containers
  full: '9999px',   // pills only — use sparingly
} as const;

export type SpacingTokens = typeof spacing;
export type RadiusTokens = typeof radius;
