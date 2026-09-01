/**
 * Review step.
 *
 * Shows the collected values in read-only form before submission, with an Edit
 * affordance that jumps back to the relevant step. No sensitive values are
 * printed to logs or URLs.
 */

import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useFormikContext } from 'formik'
import type { IntakeFormValues } from '@cap/shared'
import { StepBody } from '../StepBody'
import { getContent } from '../../context/ContentContext'
import { theme } from '../../theme'

type Props = {
  onEditStep: (step: number) => void
}

export function ReviewStep({ onEditStep }: Props) {
  const content = getContent()
  const { values } = useFormikContext<IntakeFormValues>()
  const review = content.intakeForm.review

  const rows: Array<{ label: string; value: string; step: number }> = [
    { label: content.intakeForm.contact.fields.firstName.label, value: values.firstName, step: 2 },
    { label: content.intakeForm.contact.fields.lastName.label, value: values.lastName, step: 2 },
    { label: content.intakeForm.contact.fields.email.label, value: values.email, step: 2 },
    ...(values.phone
      ? [{ label: content.intakeForm.contact.fields.phone.label, value: values.phone, step: 2 }]
      : []),
    { label: content.intakeForm.contact.fields.streetAddress.label, value: values.streetAddress, step: 2 },
    ...(values.apartment
      ? [
          {
            label: content.intakeForm.contact.fields.apartment.label,
            value: values.apartment,
            step: 2,
          },
        ]
      : []),
    { label: content.intakeForm.contact.fields.city.label, value: values.city, step: 2 },
    { label: content.intakeForm.contact.fields.state.label, value: values.state, step: 2 },
    ...(values.zipCode
      ? [{ label: content.intakeForm.contact.fields.zipCode.label, value: values.zipCode, step: 0 }]
      : []),
    {
      label: content.intakeForm.stepLabels[3],
      value:
        values.documents.length > 0
          ? values.documents.map((d) => d.name).join(', ')
          : content.intakeForm.documents.skipLabel,
      step: 3,
    },
  ]

  return (
    <StepBody>
      <Text style={styles.heading}>{review.heading}</Text>
      <Text style={styles.subheading}>{review.subheading}</Text>

      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={index} style={[styles.row, index > 0 && styles.rowBorder]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.value ? (
                <Text style={styles.rowValue}>{row.value}</Text>
              ) : (
                <Text style={styles.rowEmpty}>—</Text>
              )}
            </View>
            <Pressable
              onPress={() => onEditStep(row.step)}
              accessibilityRole="button"
              accessibilityLabel={`${review.edit} ${row.label}`}
              style={({ pressed }) => [styles.editBtn, pressed && styles.editPressed]}
              hitSlop={8}
            >
              <Text style={styles.editText}>{review.edit}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </StepBody>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subheading: {
    fontSize: 15,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  rowEmpty: {
    fontSize: 16,
    color: theme.colors.border,
  },
  editBtn: {
    minHeight: theme.minTouch,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  editPressed: {
    opacity: 0.6,
  },
  editText: {
    color: theme.colors.capPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
})
