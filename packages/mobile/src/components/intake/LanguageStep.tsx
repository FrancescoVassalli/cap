/**
 * Language selection intake step.
 *
 * Selecting a language switches the whole remaining flow live (via the content
 * context). Uses large touch targets and radio-style selectable rows with
 * screen-reader support.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useFormikContext } from 'formik'
import type { IntakeFormValues, Language } from '@cap/shared'
import { StepBody } from '../StepBody'
import { getContent, useLanguage } from '../../context/ContentContext'
import { theme } from '../../theme'

export function LanguageStep() {
  const content = getContent()
  const { setLanguage } = useLanguage()
  const { values, setFieldValue } = useFormikContext<IntakeFormValues>()
  const languageContent = content.intakeForm.language

  const options: Array<{ key: Language; label: string }> = [
    { key: 'en', label: languageContent.options.en },
    { key: 'es', label: languageContent.options.es },
  ]

  const select = (key: Language) => {
    setFieldValue('language', key)
    setLanguage(key)
  }

  return (
    <StepBody>
      <Text style={styles.stepTitle}>{languageContent.label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = values.language === option.key
          return (
            <Pressable
              key={option.key}
              onPress={() => select(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </StepBody>
  )
}

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  options: {
    gap: theme.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.minTouch,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionSelected: {
    borderColor: theme.colors.capPrimary,
    backgroundColor: theme.colors.capPrimary50,
  },
  optionPressed: {
    opacity: 0.85,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.capPrimary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.capPrimary,
  },
  optionLabel: {
    fontSize: 17,
    color: theme.colors.text,
    fontWeight: '500',
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
})
