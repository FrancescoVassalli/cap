/**
 * Contact + address intake step.
 *
 * Collects personal info, address, and contact details. Uses the shared
 * validation rules and localized copy. Field errors are tied to each field for
 * screen readers. No inline copy.
 */

import React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { useFormikContext } from 'formik'
import type { IntakeFormValues } from '@cap/shared'
import { StepBody } from '../StepBody'
import { FormField } from '../FormField'
import { TextField } from '../TextField'
import { getContent } from '../../context/ContentContext'
import { theme } from '../../theme'

export function ContactStep() {
  const content = getContent()
  const { values, handleChange, errors } = useFormikContext<IntakeFormValues>()
  const fields = content.intakeForm.contact.fields

  return (
    <StepBody>
      <Text style={styles.stepHeading}>{content.intakeForm.contact.heading}</Text>

      <FormField label={fields.firstName.label} error={errors.firstName} required>
        <TextField
          value={values.firstName}
          onChangeText={handleChange('firstName')}
          placeholder={fields.firstName.placeholder}
          error={errors.firstName}
          autoComplete="given-name"
        />
      </FormField>

      <FormField label={fields.lastName.label} error={errors.lastName} required>
        <TextField
          value={values.lastName}
          onChangeText={handleChange('lastName')}
          placeholder={fields.lastName.placeholder}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </FormField>

      <FormField label={fields.email.label} error={errors.email} required>
        <TextField
          value={values.email}
          onChangeText={handleChange('email')}
          placeholder={fields.email.placeholder}
          error={errors.email}
          inputMode="email"
          autoComplete="email"
        />
      </FormField>

      <FormField label={fields.phone.label} error={errors.phone}>
        <TextField
          value={values.phone}
          onChangeText={handleChange('phone')}
          placeholder={fields.phone.placeholder}
          error={errors.phone}
          inputMode="tel"
          autoComplete="tel"
        />
      </FormField>

      <Text style={styles.sectionLabel}>{content.intakeForm.contact.fields.streetAddress.label}</Text>

      <FormField label={fields.streetAddress.label} error={errors.streetAddress} required>
        <TextField
          value={values.streetAddress}
          onChangeText={handleChange('streetAddress')}
          placeholder={fields.streetAddress.placeholder}
          error={errors.streetAddress}
          autoComplete="street-address"
        />
      </FormField>

      <FormField label={fields.apartment.label} error={errors.apartment}>
        <TextField
          value={values.apartment}
          onChangeText={handleChange('apartment')}
          placeholder={fields.apartment.placeholder}
          error={errors.apartment}
        />
      </FormField>

      <View style={styles.row}>
        <View style={styles.rowHalf}>
          <FormField label={fields.city.label} error={errors.city} required>
            <TextField
              value={values.city}
              onChangeText={handleChange('city')}
              placeholder={fields.city.placeholder}
              error={errors.city}
              autoComplete="address-line2"
            />
          </FormField>
        </View>
        <View style={styles.rowHalf}>
          <FormField label={fields.state.label} error={errors.state} required>
            <TextField
              value={values.state}
              onChangeText={handleChange('state')}
              placeholder={fields.state.placeholder}
              error={errors.state}
              maxLength={2}
            />
          </FormField>
        </View>
      </View>

      <FormField label={fields.zipCode.label} error={errors.zipCode} hint={content.intakeForm.zip.hint}>
        <TextField
          value={values.zipCode}
          onChangeText={handleChange('zipCode')}
          placeholder={fields.zipCode.placeholder}
          error={errors.zipCode}
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
        />
      </FormField>
    </StepBody>
  )
}

const styles = StyleSheet.create({
  stepHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  rowHalf: {
    flex: 1,
  },
})
