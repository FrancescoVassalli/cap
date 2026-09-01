/**
 * Accessible step progress indicator.
 * Shows a segmented progress bar with a visible "Step X of Y" label (not
 * color-only, so screen reader + color-blind users are both covered).
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

type Props = {
  current: number
  total: number
  labels: string[]
  progressAriaLabel: string
  stepLabel: (current: number, total: number) => string
}

export function StepProgress({ current, total, labels, progressAriaLabel, stepLabel }: Props) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={progressAriaLabel}>
      <Text style={styles.label}>{stepLabel(current, total)}</Text>
      <View style={styles.track} accessibilityElementsHidden>
        {Array.from({ length: total }).map((_, index) => {
          const isComplete = index < current - 1
          const isCurrent = index === current - 1
          return (
            <View
              key={index}
              style={[
                styles.segment,
                isComplete && styles.complete,
                isCurrent && styles.current,
              ]}
            />
          )
        })}
      </View>
      <Text style={styles.stepName} accessibilityLiveRegion="polite">
        {labels[current - 1] ?? ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  track: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  complete: {
    backgroundColor: theme.colors.capPrimary,
  },
  current: {
    backgroundColor: theme.colors.capSecondary,
  },
})
