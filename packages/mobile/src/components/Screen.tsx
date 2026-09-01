/**
 * Screen layout wrapper with safe-area handling.
 * Provides consistent horizontal rhythm and a scrollable body.
 */

import React from 'react'
import { ScrollView, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../theme'

type Props = {
  children: React.ReactNode
  /** When true, the Screen provides its own scroll. Defaults to true. */
  scroll?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
}

export function Screen({ children, scroll = true, contentContainerStyle, style }: Props) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.safe,
    paddingBottom: theme.spacing.xl * 2,
  },
})
