/**
 * Screen heading with accessible heading role.
 */

import React from 'react'
import { Text, StyleSheet, type TextProps } from 'react-native'
import { theme } from '../theme'

type Props = TextProps & {
  children: React.ReactNode
  level?: 'h1' | 'h2'
}

export function ScreenTitle({ children, level = 'h1', style, ...props }: Props) {
  return (
    <Text
      {...props}
      accessibilityRole="header"
      style={[level === 'h1' ? styles.h1 : styles.h2, style]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 32,
    marginBottom: theme.spacing.md,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
})
