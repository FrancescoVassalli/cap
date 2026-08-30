import { Form, Formik, type FormikHelpers } from 'formik'
import { useMemo, useState, type ChangeEvent } from 'react'
import { type NavigateFunction } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { FormField } from '@/components/forms/FormField'
import { RadioGroup } from '@/components/forms/RadioGroup'
import { TextInput } from '@/components/forms/TextInput'
import { ZipInput } from '@/components/forms/ZipInput'
import { MockSubmissionService } from '@/services/submissionService'
import { MockZipService } from '@/services/zipService'
import type { IntakeDocument, IntakeFormValues } from '@/types/index'
import { intakeSchema } from '@/validation/intakeSchema'

const zipService = new MockZipService()
const submissionService = new MockSubmissionService()

const stepTitles = ['Location', 'Language', 'Contact information', 'Documents'] as const

const initialValues: IntakeFormValues = {
  zipCode: '',
  language: 'en',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  streetAddress: '',
  apartment: '',
  city: '',
  state: '',
  documents: [],
}

function validateStep(step: number, values: IntakeFormValues) {
  const errors: Partial<Record<keyof IntakeFormValues, string>> = {}

  if (step === 0) {
    const cleanZip = values.zipCode.trim()
    if (cleanZip && !/^\d{5}$/.test(cleanZip)) {
      errors.zipCode = 'ZIP code must be 5 digits'
    }
  }

  if (step === 1 && !values.language) {
    errors.language = 'Please select a language'
  }

  if (step === 2) {
    if (!values.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!values.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!values.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!values.streetAddress.trim()) {
      errors.streetAddress = 'Street address is required'
    }
    if (!values.city.trim()) {
      errors.city = 'City is required'
    }
    if (!values.state.trim()) {
      errors.state = 'State is required'
    }
  }

  return errors
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function IntakePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [referenceId, setReferenceId] = useState('')
  const [zipNotice, setZipNotice] = useState('')

  const totalSteps = stepTitles.length

  const stepMeta = useMemo(
    () => ({
      label: stepTitles[currentStep],
      stepNumber: currentStep + 1,
    }),
    [currentStep]
  )

  const handleSubmit = async (values: IntakeFormValues, helpers: FormikHelpers<IntakeFormValues>) => {
    setSubmissionStatus('loading')
    try {
      const result = await submissionService.submit({
        zipCode: values.zipCode,
        language: values.language,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        streetAddress: values.streetAddress,
        apartment: values.apartment,
        city: values.city,
        state: values.state,
      })

      if (!result.success) {
        setSubmissionStatus('error')
        helpers.setFieldError('email', result.message || 'We could not submit your request.')
        return
      }

      setReferenceId(result.referenceId || 'CAP-0000')
      setSubmissionStatus('success')
    } catch {
      setSubmissionStatus('error')
      helpers.setFieldError('email', 'We could not connect to the service.')
    }
  }

  if (submissionStatus === 'success') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-4 text-3xl font-bold text-cap-primary">Request received</h1>
          <p className="mb-4 text-base text-slate-700">
            Thank you for contacting the Consumer Assistance Program. A member of our team will review your request and contact you by phone or email.
          </p>
          <p className="mb-6 text-slate-700">
            CAP generally responds within five business days, although it may take longer when we receive a high volume of requests.
          </p>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Your reference number is</p>
            <p className="mt-2 text-2xl font-bold text-cap-primary">{referenceId}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={intakeSchema}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldError, validateForm, setTouched }) => {
        const handleNext = async () => {
          const stepErrors = validateStep(currentStep, values)
          const fieldNames = Object.keys(stepErrors) as Array<keyof IntakeFormValues>

          if (fieldNames.length > 0) {
            fieldNames.forEach((fieldName) => {
              setFieldError(fieldName, stepErrors[fieldName])
            })
            const touchedFields: Record<string, boolean> = {}
            fieldNames.forEach((fieldName) => {
              touchedFields[fieldName] = true
            })
            setTouched(touchedFields)
            return
          }

          if (currentStep < totalSteps - 1) {
            setCurrentStep((step) => step + 1)
            setZipNotice('')
            return
          }

          const fullErrors = await validateForm()
          if (Object.keys(fullErrors).length > 0) {
            setTouched({
              zipCode: true,
              language: true,
              firstName: true,
              lastName: true,
              email: true,
              streetAddress: true,
              city: true,
              state: true,
            })
            return
          }

          await handleSubmit(values, { setFieldError, setTouched } as FormikHelpers<IntakeFormValues>)
        }

        const handleZipChange = (event: ChangeEvent<HTMLInputElement>) => {
          const nextZip = event.target.value.replace(/\D/g, '').slice(0, 5)
          handleChange({
            ...event,
            target: {
              ...event.target,
              name: 'zipCode',
              value: nextZip,
            },
          })

          const location = zipService.lookup(nextZip)
          if (location) {
            setFieldValue('city', location.city)
            setFieldValue('state', location.state)
            setZipNotice('')
            return
          }

          if (nextZip.length === 5) {
            setZipNotice("We couldn't find that ZIP code. You can continue and enter your address manually.")
          } else {
            setZipNotice('')
          }
        }

        const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
          const selected = Array.from(event.target.files ?? [])
          const resultingDocuments: IntakeDocument[] = selected.map((file) => ({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
          }))

          setFieldValue('documents', resultingDocuments)
        }

        return (
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Step {stepMeta.stepNumber} of {totalSteps}</p>
              <h1 className="mt-1 text-2xl font-bold text-cap-primary">{stepMeta.label}</h1>
            </div>

            <Form className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900">What ZIP code do you live in?</h2>

                  <FormField
                    label="ZIP code"
                    htmlFor="zipCode"
                    error={touched.zipCode && errors.zipCode ? errors.zipCode : undefined}
                    hint="We’ll use this to help fill in your city and state."
                  >
                    <ZipInput
                      id="zipCode"
                      name="zipCode"
                      value={values.zipCode}
                      onChange={handleZipChange}
                      onBlur={handleBlur}
                      isInvalid={Boolean(touched.zipCode && errors.zipCode)}
                      aria-invalid={Boolean(touched.zipCode && errors.zipCode)}
                    />
                  </FormField>

                  {zipNotice && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {zipNotice}
                    </div>
                  )}

                  <button
                    type="button"
                    className="text-sm font-medium text-cap-primary underline underline-offset-2"
                    onClick={() => {
                      setFieldValue('zipCode', '')
                      setFieldValue('city', '')
                      setFieldValue('state', '')
                      setZipNotice('')
                    }}
                  >
                    Skip this step
                  </button>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900">Preferred language</h2>
                  <FormField
                    error={touched.language && errors.language ? errors.language : undefined}
                  >
                    <RadioGroup
                      name="language"
                      value={values.language}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Español' },
                      ]}
                      isInvalid={Boolean(touched.language && errors.language)}
                    />
                  </FormField>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-slate-900">Contact information</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="First name" htmlFor="firstName" required error={touched.firstName && errors.firstName ? errors.firstName : undefined}>
                      <TextInput
                        id="firstName"
                        name="firstName"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="given-name"
                        aria-required="true"
                        isInvalid={Boolean(touched.firstName && errors.firstName)}
                      />
                    </FormField>

                    <FormField label="Last name" htmlFor="lastName" required error={touched.lastName && errors.lastName ? errors.lastName : undefined}>
                      <TextInput
                        id="lastName"
                        name="lastName"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="family-name"
                        aria-required="true"
                        isInvalid={Boolean(touched.lastName && errors.lastName)}
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Email address" htmlFor="email" required error={touched.email && errors.email ? errors.email : undefined}>
                      <TextInput
                        id="email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="email"
                        aria-required="true"
                        isInvalid={Boolean(touched.email && errors.email)}
                      />
                    </FormField>

                    <FormField label="Phone" htmlFor="phone" error={touched.phone && errors.phone ? errors.phone : undefined}>
                      <TextInput
                        id="phone"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="tel"
                        isInvalid={Boolean(touched.phone && errors.phone)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Street address" htmlFor="streetAddress" required error={touched.streetAddress && errors.streetAddress ? errors.streetAddress : undefined}>
                    <TextInput
                      id="streetAddress"
                      name="streetAddress"
                      value={values.streetAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="street-address"
                      aria-required="true"
                      isInvalid={Boolean(touched.streetAddress && errors.streetAddress)}
                    />
                  </FormField>

                  <FormField label="Apartment/unit" htmlFor="apartment" error={touched.apartment && errors.apartment ? errors.apartment : undefined}>
                    <TextInput
                      id="apartment"
                      name="apartment"
                      value={values.apartment}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="address-line2"
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="City" htmlFor="city" required error={touched.city && errors.city ? errors.city : undefined}>
                      <TextInput
                        id="city"
                        name="city"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="address-level2"
                        aria-required="true"
                        isInvalid={Boolean(touched.city && errors.city)}
                      />
                    </FormField>

                    <FormField label="State" htmlFor="state" required error={touched.state && errors.state ? errors.state : undefined}>
                      <TextInput
                        id="state"
                        name="state"
                        value={values.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="address-level1"
                        aria-required="true"
                        isInvalid={Boolean(touched.state && errors.state)}
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
                  <p className="text-base text-slate-700">
                    You can upload documents that may help our team understand your situation. Examples include medical bills, explanation of benefits, insurance letters, claim denial letters, and other relevant documents.
                  </p>

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <label htmlFor="documents" className="block text-sm font-medium text-slate-800">
                      Choose files
                    </label>
                    <input
                      id="documents"
                      name="documents"
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      multiple
                      onChange={handleFileChange}
                      className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded file:border-0 file:bg-cap-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                    <p className="mt-3 text-xs text-slate-600">PDF, JPG, or PNG up to 10 MB per file.</p>
                  </div>

                  {values.documents.length > 0 && (
                    <ul className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {values.documents.map((document) => (
                        <li key={document.id} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2">
                          <div>
                            <p className="font-medium text-slate-900">{document.name}</p>
                            <p className="text-xs text-slate-600">{formatFileSize(document.size)}</p>
                          </div>
                          <button
                            type="button"
                            className="text-sm font-medium text-status-error underline underline-offset-2"
                            onClick={() => setFieldValue('documents', [])}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    className="text-sm font-medium text-cap-primary underline underline-offset-2"
                    onClick={() => setFieldValue('documents', [])}
                  >
                    Skip this step
                  </button>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                  disabled={currentStep === 0}
                >
                  Back
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext} isLoading={submissionStatus === 'loading'}>
                    Submit Request
                  </Button>
                )}
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

export function IntakeStartButton({ navigate }: { navigate: NavigateFunction }) {
  const beginIntake = () => {
    const intakeId = crypto.randomUUID()
    navigate(`/intake/${intakeId}`)
  }

  return (
    <Button type="button" onClick={beginIntake}>
      Start a new request
    </Button>
  )
}
