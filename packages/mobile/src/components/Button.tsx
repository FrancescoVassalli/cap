/**
 * Accessible button primitive.
 *
 * Enforces the shared 44pt minimum touch target, visible pressed/focus states,
 * and screen-reader labels. No business logic or PHI here.
 */

import React from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
  type AccessibilityRole,
} from 'react-native'
import { theme } from '../theme'

type ButtonVariant = 'primary' | 'secondary' | 'highlight' | 'ghost' | 'danger'

type Props = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
  style?: StyleProp<ViewStyle>
  fullWidth?: boolean
}

const variantColors: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: theme.colors.capPrimary, fg: '#ffffff' },
  secondary: { bg: theme.colors.capSecondary, fg: '#ffffff' },
  highlight: { bg: theme.colors.capHighlight, fg: theme.colors.capPrimary },
  ghost: { bg: 'transparent', fg: theme.colors.capPrimary, border: theme.colors.capPrimary },
  danger: { bg: theme.colors.error, fg: '#ffffff' },
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  fullWidth = true,
}: Props) {
  const palette = variantColors[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, minHeight: theme.minTouch },
        palette.border ? { borderWidth: 2, borderColor: palette.border } : null,
        fullWidth ? styles.fullWidth : null,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} accessibilityLabel={label} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: palette.fg },
            variant === 'highlight' ? { fontWeight: '700' as const } : null,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: theme.minTouch,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: 0.5,
  },
})
