import type { PropsWithChildren } from 'react';
import type { TextProps as RNTextProps } from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/theme';
import type { TextVariant } from '@/theme';

type AppTextProps = PropsWithChildren<
  RNTextProps & {
    variant?: TextVariant;
    color?: string;
    align?: 'auto' | 'left' | 'right' | 'center';
  }
>;

const headingVariants: TextVariant[] = ['display', 'title', 'heading'];

export function AppText({
  variant = 'body',
  color = colors.semantic.text,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      accessibilityRole={headingVariants.includes(variant) ? 'header' : undefined}
      {...rest}
      style={[
        typographyStyles[variant],
        { color },
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const typographyStyles = StyleSheet.create({
  display: typography.display,
  title: typography.title,
  heading: typography.heading,
  body: typography.body,
  caption: typography.caption,
});

export type { TextVariant };