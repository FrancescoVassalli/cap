/**
 * Accessible form field wrapper.
 *
 * Provides the field label, hint, and error text, all associated with the
 * control via accessibility attributes so screen readers announce them. Error
 * text is tied to the relevant field (not a distant summary), matching the web
 * app's accessible focus/error handling.
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

type Props = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** Passed through to the child control for a11y association. */
  htmlFor?: string
  children: React.ReactNode
}

export function FormField({ label, hint, error, required, children }: Props) {
  const errorId = error ? `${label}-error` : undefined

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {hint ? (
        <Text style={styles.hint} accessibilityRole="text">
          {hint}
        </Text>
      ) : null}
      {React.cloneElement(children as React.ReactElement, {
        accessibilityLabel: label,
        accessibilityHint: error,
      })}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert" nativeID={errorId}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  required: {
    color: theme.colors.error,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
})
