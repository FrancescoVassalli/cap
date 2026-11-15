import type { ChangeEvent, FocusEvent } from 'react'
import { FormField } from '@/components/forms/FormField'
import { ZipInput } from '@/components/forms/ZipInput'
import type { AllContent } from '@/content'
import type { IntakeFormValues } from '@/types/index'
import type { FormikErrors, FormikTouched } from 'formik'

interface ZipStepProps {
  content: AllContent
  values: IntakeFormValues
  errors: FormikErrors<IntakeFormValues>
  touched: FormikTouched<IntakeFormValues>
  zipNotice: string
  onZipChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
}

export function ZipStep({ content, values, errors, touched, zipNotice, onZipChange, onBlur }: ZipStepProps) {
  const zipError = touched.zipCode && errors.zipCode ? errors.zipCode : undefined

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.zip.label}</h2>

      <FormField
        label={content.intakeForm.contact.fields.zipCode.label}
        htmlFor="zipCode"
        error={zipError}
        hint={content.intakeForm.zip.hint}
      >
        <ZipInput
          id="zipCode"
          name="zipCode"
          placeholder={content.intakeForm.zip.placeholder}
          value={values.zipCode}
          onChange={onZipChange}
          onBlur={onBlur}
          isInvalid={Boolean(zipError)}
          aria-invalid={Boolean(zipError)}
        />
      </FormField>

      {zipNotice && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          {zipNotice}
        </div>
      )}
    </div>
  )
}