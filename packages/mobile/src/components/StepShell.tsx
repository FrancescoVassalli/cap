/**
 * Intake step shell.
 *
 * Provides the consistent step layout: progress indicator, scrollable body,
 * and a sticky action footer with Back / Continue. Pulls localized copy from
 * the content layer. No business logic.
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StepProgress } from './StepProgress'
import { Button } from './Button'
import { getContent } from '../context/ContentContext'
import { theme } from '../theme'

type Props = {
  stepIndex: number // 0-based
  children: React.ReactNode
  onBack?: () => void
  onContinue?: () => void
  continueLabel?: string
  continueDisabled?: boolean
  continueLoading?: boolean
  /** Hides the Back button (first step). */
  hideBack?: boolean
}

export function StepShell({
  stepIndex,
  children,
  onBack,
  onContinue,
  continueLabel,
  continueDisabled,
  continueLoading,
  hideBack,
}: Props) {
  const content = getContent()
  const nav = content.intakeForm.navigation
  const total = 5

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <StepProgress
          current={stepIndex + 1}
          total={total}
          labels={content.intakeForm.stepLabels}
          progressAriaLabel={nav.progressAriaLabel}
          stepLabel={nav.progressLabel}
        />
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.footer}>
        {!hideBack && onBack ? (
          <View style={styles.backWrap}>
            <Button label={nav.back} variant="ghost" onPress={onBack} fullWidth={false} />
          </View>
        ) : null}
        {onContinue ? (
          <View style={styles.continueWrap}>
            <Button
              label={continueLabel ?? nav.continue}
              onPress={onContinue}
              disabled={continueDisabled}
              loading={continueLoading}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.safe,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  body: {
    flex: 1,
    padding: theme.spacing.safe,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.safe,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  backWrap: {
    minWidth: 96,
  },
  continueWrap: {
    flex: 1,
  },
})
