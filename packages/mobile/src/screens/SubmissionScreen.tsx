/**
 * Submission result screen.
 *
 * Handles the success, generic error, network error, and session-expired states
 * with localized copy and clear retry/restart actions. Uses the shared error
 * taxonomy; never exposes raw exceptions or sensitive data.
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Screen } from '../components/Screen'
import { ScreenTitle } from '../components/ScreenTitle'
import { Button } from '../components/Button'
import { useLanguage } from '../context/ContentContext'
import type { SubmissionErrorKind, Language } from '@cap/shared'
import { theme } from '../theme'

type Props =
  | {
      kind: 'success'
      referenceId?: string
      language: Language
      onFinish: () => void
      onRetry?: never
      onRestart?: never
    }
  | {
      kind: SubmissionErrorKind
      onRetry: () => void
      onRestart: () => void
      referenceId?: never
      language?: never
      onFinish?: never
    }

export function SubmissionScreen(props: Props) {
  const content = useLanguage().content
  const sub = content.submission

  if (props.kind === 'success') {
    const successContent = sub.success
    return (
      <Screen>
        <View style={[styles.card, styles.successCard]}>
          <Text style={styles.badge} accessibilityElementsHidden>
            ✓
          </Text>
          <ScreenTitle level="h1">{successContent.heading}</ScreenTitle>
          <Text style={styles.body}>{successContent.message}</Text>
          {props.referenceId ? (
            <View style={styles.reference}>
              <Text style={styles.referenceLabel}>{successContent.referenceNumberLabel}</Text>
              <Text style={styles.referenceValue} accessibilityRole="text">
                {props.referenceId}
              </Text>
            </View>
          ) : null}
          <Text style={styles.body}>{successContent.nextSteps}</Text>
          <Text style={styles.reminder}>{successContent.contactInfoReminder}</Text>
          <Button label={successContent.doneLabel} onPress={props.onFinish} variant="primary" />
        </View>
      </Screen>
    )
  }

  const isSessionExpired = props.kind === 'sessionExpired'
  const heading =
    props.kind === 'networkError'
      ? sub.networkError.heading
      : props.kind === 'sessionExpired'
        ? sub.sessionExpired.heading
        : sub.error.heading
  const message =
    props.kind === 'networkError'
      ? sub.networkError.message
      : props.kind === 'sessionExpired'
        ? sub.sessionExpired.message
        : sub.error.message

  return (
    <Screen>
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.badgeError} accessibilityElementsHidden>
          !
        </Text>
        <ScreenTitle level="h1">{heading}</ScreenTitle>
        <Text style={styles.body}>{message}</Text>
        {isSessionExpired ? (
          <Button
            label={sub.sessionExpired.newRequestLabel}
            onPress={props.onRestart}
            variant="primary"
          />
        ) : (
          <View style={styles.retryRow}>
            <Button label={sub.error.retryLabel} onPress={props.onRetry} variant="primary" />
            <Button label={sub.error.contactLabel} onPress={props.onRestart} variant="ghost" />
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  successCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badge: {
    fontSize: 44,
    color: theme.colors.success,
    textAlign: 'center',
  },
  badgeError: {
    fontSize: 44,
    color: theme.colors.error,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
  },
  reminder: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  reference: {
    backgroundColor: theme.colors.capPrimary50,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  referenceLabel: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  referenceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.capPrimary,
    marginTop: theme.spacing.xs,
  },
  retryRow: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
})
