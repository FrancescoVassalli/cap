import { colors } from './colors';
import { layout, radii, spacing, touchTarget } from './spacing';
import { fontFamily, typography } from './typography';
import type { TextVariant } from './typography';

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  layout: typeof layout;
  radii: typeof radii;
  touchTarget: typeof touchTarget;
  fontFamily: typeof fontFamily;
  typography: Record<TextVariant, object>;
};

export const theme: Theme = {
  colors,
  spacing,
  layout,
  radii,
  touchTarget,
  fontFamily,
  typography,
};

export { colors, spacing, layout, radii, touchTarget, fontFamily, typography };
export type { TextVariant };