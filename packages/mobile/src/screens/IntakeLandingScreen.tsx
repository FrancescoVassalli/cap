/**
 * Intake landing screen.
 * Mirrors the web /intake informational page: orientation, what-you-need
 * guidance, privacy notice, and the CTA that generates a new intake id and
 * enters the form. No inline copy.
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Screen } from '../components/Screen'
import { ScreenTitle } from '../components/ScreenTitle'
import { Button } from '../components/Button'
import type { RootStackParamList } from '../navigation/types'
import { getContent } from '../context/ContentContext'
import { theme } from '../theme'
import { randomUUID } from '../utils/id'

type Props = NativeStackScreenProps<RootStackParamList, 'IntakeLanding'>

export function IntakeLandingScreen({ navigation }: Props) {
  const content = getContent()
  const { intakeLanding } = content

  const handleStart = () => {
    navigation.navigate('Intake', { intakeId: randomUUID() })
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{intakeLanding.heading}</Text>
        <Text style={styles.heroSubtitle}>{intakeLanding.subheading}</Text>
      </View>

      <View style={styles.section}>
        <ScreenTitle level="h2">{intakeLanding.beforeYouBeginHeading}</ScreenTitle>
        <Text style={styles.body}>{intakeLanding.beforeYouBeginDescription}</Text>
        {intakeLanding.beforeYouBeginItems.map((item, index) => (
          <View key={index} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.body}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.body}>{intakeLanding.estimatedTime}</Text>
        <Text style={styles.body}>{intakeLanding.dataUse}</Text>
      </View>

      <View style={styles.section}>
        <ScreenTitle level="h2">{content.appShell.brand} — {intakeLanding.beforeYouBeginHeading}</ScreenTitle>
        {intakeLanding.keyPoints.map((point, index) => (
          <View key={index} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.body}>{point}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={intakeLanding.startCta}
          variant="highlight"
          onPress={handleStart}
          accessibilityHint="Begins the intake form"
        />
        <Text style={styles.privacy}>{content.appShell.disclaimer}</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: theme.colors.capPrimary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.capSecondary50,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
    flexShrink: 1,
  },
  listRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  bullet: {
    color: theme.colors.capPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    gap: theme.spacing.md,
    marginTop: 'auto',
  },
  privacy: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
  },
})
