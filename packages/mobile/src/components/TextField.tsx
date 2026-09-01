/**
 * Accessible text input primitive.
 *
 * Enforces the shared 44pt minimum touch target and large, readable text with
 * a visible focus state. Purely presentational — no business logic or PHI.
 */

import React, { useState } from 'react'
import {
  TextInput,
  StyleSheet,
  View,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native'
import { theme } from '../theme'

/** RN-compatible subset of autofill values we use across the intake. */
type AutoCompleteValue =
  | 'email'
  | 'name'
  | 'tel'
  | 'street-address'
  | 'postal-code'
  | 'given-name'
  | 'family-name'
  | 'address-line2'

type Props = Omit<TextInputProps, 'autoComplete'> & {
  label?: string
  error?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  autoComplete?: AutoCompleteValue
}

export function TextField({ style, onFocus, onBlur, error, inputMode, ...props }: Props) {
  const [focused, setFocused] = useState(false)

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(true)
    onFocus?.(e)
  }
  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false)
    onBlur?.(e)
  }

  return (
    <View>
      <TextInput
        {...props}
        style={[
          styles.input,
          focused && styles.focused,
          error ? styles.hasError : null,
          style,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityState={error ? { expanded: true } : undefined}
        placeholderTextColor={theme.colors.muted}
        {...(inputMode === 'email' ? { keyboardType: 'email-address', autoCapitalize: 'none' } : null)}
        {...(inputMode === 'tel' ? { keyboardType: 'phone-pad' } : null)}
        {...(inputMode === 'numeric' ? { keyboardType: 'number-pad' } : null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    minHeight: theme.minTouch,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  focused: {
    borderColor: theme.colors.focus,
  },
  hasError: {
    borderColor: theme.colors.error,
  },
})
