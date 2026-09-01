/**
 * Home / How We Help screen.
 * Mirrors the web /how-we-help informational page using the localized content
 * module and CAP branding. No inline copy.
 */

import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Screen } from '../components/Screen'
import { ScreenTitle } from '../components/ScreenTitle'
import { Button } from '../components/Button'
import type { RootStackParamList } from '../navigation/types'
import { getContent } from '../context/ContentContext'
import { theme } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export function HomeScreen({ navigation }: Props) {
  const content = getContent()
  const { howWeHelp } = content

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} nestedScrollEnabled>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>CAP</Text>
          <Text style={styles.heroTitle}>{howWeHelp.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{howWeHelp.heroSubtitle}</Text>
          <Button
            label={howWeHelp.ctaGetHelp}
            variant="highlight"
            onPress={() => navigation.navigate('IntakeLanding')}
          />
        </View>

        <View style={styles.section}>
          <ScreenTitle level="h2">{howWeHelp.whatWeHelpHeading}</ScreenTitle>
          {howWeHelp.services.map((service) => (
            <View key={service.title} style={styles.card}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardBody}>{service.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <ScreenTitle level="h2">{howWeHelp.howItWorksHeading}</ScreenTitle>
          {howWeHelp.steps.map((step, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.stepRow}>
                <View style={styles.stepChip}>
                  <Text style={styles.stepChipText}>{index + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{step.title}</Text>
              </View>
              <Text style={styles.cardBody}>{step.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.notDo}>
          <ScreenTitle level="h2">{howWeHelp.whatWeDontHeading}</ScreenTitle>
          <Text style={styles.cardBody}>{howWeHelp.whatWeDontDescription}</Text>
        </View>

        <View style={styles.section}>
          <ScreenTitle level="h2">{howWeHelp.expectationsHeading}</ScreenTitle>
          <Text style={styles.cardBody}>{howWeHelp.responseTime}</Text>
          <Text style={styles.cardBody}>{howWeHelp.volumeWarning}</Text>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    backgroundColor: theme.colors.capPrimary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  heroEyebrow: {
    color: theme.colors.capHighlight,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.capPrimary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  stepChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.capHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChipText: {
    color: theme.colors.capPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  notDo: {
    backgroundColor: theme.colors.capSecondary50,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
})
