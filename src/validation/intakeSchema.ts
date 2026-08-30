import * as Yup from 'yup'
import { getContent } from '@/content'
import type { AllContent } from '@/content'

export const PHONE_NUMBER_RE = /^[\d\s()+.-]{7,}$/

export function createIntakeSchema(content: AllContent) {
  const errors = content.intakeForm.errors

  return Yup.object({
    zipCode: Yup.string()
      .trim()
      .matches(/^\d{5}$|^$/, errors.zipMustBeFiveDigits),
    language: Yup.mixed<'en' | 'es'>().oneOf(['en', 'es']).required(errors.selectLanguage),
    firstName: Yup.string().trim().required(errors.required),
    lastName: Yup.string().trim().required(errors.required),
    email: Yup.string().trim().email(errors.invalidEmail).required(errors.required),
    phone: Yup.string()
      .trim()
      .test('valid-phone', errors.invalidPhone, (value) => !value || PHONE_NUMBER_RE.test(value)),
    streetAddress: Yup.string().trim().required(errors.required),
    apartment: Yup.string().trim().optional(),
    city: Yup.string().trim().required(errors.required),
    state: Yup.string().trim().required(errors.required),
    documents: Yup.array().default([]),
  })
}

export const intakeSchema = createIntakeSchema(getContent('en'))

export const zipSchema = Yup.string()
  .trim()
  .matches(/^\d{5}$|^$/, getContent('en').intakeForm.errors.zipMustBeFiveDigits)
  .nullable()