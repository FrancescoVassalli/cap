import type { ChangeEvent, FocusEvent } from 'react'
import { FormField } from '@/components/forms/FormField'
import { RadioGroup } from '@/components/forms/RadioGroup'
import type { AllContent } from '@/content'
import { LanguageFlag } from './LanguageFlag'
import type { IntakeFormValues } from '@/types/index'
import type { FormikErrors, FormikTouched } from 'formik'

interface LanguageStepProps {
  content: AllContent
  value: string
  errors: FormikErrors<IntakeFormValues>
  touched: FormikTouched<IntakeFormValues>
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
}

export function LanguageStep({ content, value, errors, touched, onChange, onBlur }: LanguageStepProps) {
  const languageError = touched.language && errors.language ? errors.language : undefined

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.language.label}</h2>

      <FormField error={languageError}>
        <RadioGroup
          name="language"
          legend={content.intakeForm.language.label}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          options={[
            {
              value: 'en',
              label: content.intakeForm.language.options.en,
              icon: <LanguageFlag language="en" />,
            },
            {
              value: 'es',
              label: content.intakeForm.language.options.es,
              icon: <LanguageFlag language="es" />,
            },
          ]}
          isInvalid={Boolean(languageError)}
        />
      </FormField>
    </div>
  )
}