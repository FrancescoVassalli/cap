/**
 * Reusable scrollable step body with keyboard handling.
 */

import React from 'react'
import { ScrollView, StyleSheet, type ViewStyle, type StyleProp } from 'react-native'
import { theme } from '../theme'

export function StepBody({
  children,
  contentContainerStyle,
}: {
  children: React.ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.safe,
    paddingBottom: theme.spacing.xl,
  },
})
