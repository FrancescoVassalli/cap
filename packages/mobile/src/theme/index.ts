/**
 * CAP mobile theme tokens.
 *
 * Structurally mirrors the web app's Tailwind CSS-first design tokens in
 * `src/index.css` so the mobile experience stays on the same CAP/CCHI palette.
 * Pure data — no components import platform logic or PHI here.
 */

export const colors = {
  /** CAP primary blue */
  capPrimary: '#1f4e79',
  capPrimary50: '#eef4f9',
  capPrimary100: '#dce9f2',
  /** CAP secondary blue */
  capSecondary: '#2b6cb0',
  capSecondary50: '#eaf2fa',
  /** CAP highlight yellow */
  capHighlight: '#fec524',
  /** semantic */
  error: '#b42318',
  success: '#137a3b',
  focus: '#2563eb',
  text: '#1a202c',
  muted: '#4a5568',
  border: '#cbd5e1',
  background: '#f7f9fb',
  surface: '#ffffff',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** safe horizontal gutter */
  safe: 20,
} as const

export const minTouch = 44
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const

export type Theme = typeof theme

export const theme = {
  colors,
  spacing,
  radius,
  minTouch,
} as const
