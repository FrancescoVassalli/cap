/**
 * ZIP / Location intake step.
 *
 * Optional ZIP entry with a look-up that autofills city/state via the shared
 * ZipService behind the service boundary. Supports "not found" notice and a
 * blank-continue skip path. No inline copy; no raw dataset imports.
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useFormikContext } from 'formik'
import type { IntakeFormValues } from '@cap/shared'
import { validateIntakeStep } from '@cap/shared'
import { StepBody } from '../StepBody'
import { FormField } from '../FormField'
import { TextField } from '../TextField'
import { Button } from '../Button'
import { getContent } from '../../context/ContentContext'
import { mobileServices } from '../../services'
import { theme } from '../../theme'

export function ZipStep() {
  const content = getContent()
  const zipContent = content.intakeForm.zip
  const { values, setFieldValue, setTouched, errors } = useFormikContext<IntakeFormValues>()
  const [lookingUp, setLookingUp] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const handleLookup = async () => {
    const zip = values.zipCode.trim()
    setTouched({ zipCode: true })
    const stepErrors = validateIntakeStep(0, values, content.intakeForm.errors)
    if (stepErrors.zipCode) return

    setLookingUp(true)
    setNotFound(false)
    const location = mobileServices.zip.lookup(zip)
    setLookingUp(false)
    if (!location) {
      setNotFound(true)
      return
    }
    setNotFound(false)
    await setFieldValue('city', location.city)
    await setFieldValue('state', location.state)
  }

  return (
    <StepBody>
      <Text style={styles.stepTitle}>{zipContent.label}</Text>
      <Text style={styles.hint}>{zipContent.hint}</Text>
      <FormField label={zipContent.label} hint={zipContent.hint} error={errors.zipCode}>
        <TextField
          value={values.zipCode}
          onChangeText={(text) => {
            setFieldValue('zipCode', text)
            if (notFound) setNotFound(false)
          }}
          placeholder={zipContent.placeholder}
          error={errors.zipCode}
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
        />
      </FormField>
      <View style={styles.lookupWrap}>
        <Button
          label={lookingUp ? zipContent.applying : zipContent.lookUp}
          variant="secondary"
          onPress={handleLookup}
          loading={lookingUp}
          disabled={!values.zipCode.trim() || /^\d{5}$/.test(values.zipCode.trim()) === false}
          fullWidth={false}
        />
      </View>
      {notFound ? (
        <Text style={styles.notFound} accessibilityRole="alert">
          {zipContent.notFoundMessage}
        </Text>
      ) : null}
    </StepBody>
  )
}

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  lookupWrap: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  notFound: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.error,
    backgroundColor: theme.colors.capPrimary50,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
})
