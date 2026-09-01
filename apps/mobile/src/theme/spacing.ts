export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const layout = {
  screenPadding: spacing.md,
  maxContentWidth: 960,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

// WCAG 2.2 AA / accessibility-driven minimum touch target size.
export const touchTarget = {
  minWidth: 44,
  minHeight: 44,
} as const;