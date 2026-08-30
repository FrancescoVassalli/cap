import * as Yup from 'yup'

export const zipSchema = Yup.string().trim().matches(/^\d{5}$/, 'ZIP code must be 5 digits').nullable()

export const intakeSchema = Yup.object({
  zipCode: Yup.string().trim().matches(/^\d{5}$|^$/, 'ZIP code must be 5 digits or empty'),
  language: Yup.mixed<'en' | 'es'>().oneOf(['en', 'es']).required('Please select a language'),
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  phone: Yup.string().trim().optional(),
  streetAddress: Yup.string().trim().required('Street address is required'),
  apartment: Yup.string().trim().optional(),
  city: Yup.string().trim().required('City is required'),
  state: Yup.string().trim().required('State is required'),
  documents: Yup.array().default([]),
})
