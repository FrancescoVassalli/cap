import type { ChangeEvent, FocusEvent } from 'react'
import { FormField } from '@/components/forms/FormField'
import { RadioGroup } from '@/components/forms/RadioGroup'
import type { AllContent } from '@/content'
import type { IntakeFormValues } from '@/types/index'
import type { FormikErrors, FormikTouched } from 'formik'

interface LanguageStepProps {
  content: AllContent
  errors: FormikErrors<IntakeFormValues>
  touched: FormikTouched<IntakeFormValues>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
}

export function LanguageStep({ content, errors, touched, onChange, onBlur }: LanguageStepProps) {
  const languageError = touched.language && errors.language ? errors.language : undefined

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.language.label}</h2>

      <FormField error={languageError}>
        <RadioGroup
          name="language"
          onChange={onChange}
          onBlur={onBlur}
          options={[
            { value: 'en', label: content.intakeForm.language.options.en },
            { value: 'es', label: content.intakeForm.language.options.es },
          ]}
          isInvalid={Boolean(languageError)}
        />
      </FormField>
    </div>
  )
}