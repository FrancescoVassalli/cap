import { Form, Formik } from 'formik'
import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { FormField } from '@/components/forms/FormField'
import { RadioGroup } from '@/components/forms/RadioGroup'
import { TextInput } from '@/components/forms/TextInput'
import { ZipInput } from '@/components/forms/ZipInput'
import { getContent, type AllContent } from '@/content'
import { MockSubmissionService } from '@/services/submissionService'
import { MockZipService } from '@/services/zipService'
import type { IntakeDocument, IntakeFormValues } from '@/types/index'
import { intakeSchema } from '@/validation/intakeSchema'

const zipService = new MockZipService()
const submissionService = new MockSubmissionService()

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

function validateStep(step: number, values: IntakeFormValues, content: AllContent) {
  const errors: Partial<Record<keyof IntakeFormValues, string>> = {}
  const errorMessages = content.intakeForm.errors

  if (step === 0) {
    const cleanZip = values.zipCode.trim()
    if (cleanZip && !/^\d{5}$/.test(cleanZip)) {
      errors.zipCode = errorMessages.zipMustBeFiveDigits
    }
  }

  if (step === 1 && !values.language) {
    errors.language = errorMessages.selectLanguage
  }

  if (step === 2) {
    if (!values.firstName.trim()) {
      errors.firstName = errorMessages.required
    }
    if (!values.lastName.trim()) {
      errors.lastName = errorMessages.required
    }
    if (!values.email.trim()) {
      errors.email = errorMessages.required
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = errorMessages.invalidEmail
    }
    if (!values.streetAddress.trim()) {
      errors.streetAddress = errorMessages.required
    }
    if (!values.city.trim()) {
      errors.city = errorMessages.required
    }
    if (!values.state.trim()) {
      errors.state = errorMessages.required
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
  const [submissionError, setSubmissionError] = useState<'error' | 'networkError'>('error')
  const [referenceId, setReferenceId] = useState('')
  const [zipNotice, setZipNotice] = useState('')
  const [submittedLanguage, setSubmittedLanguage] = useState<'en' | 'es'>('en')

  const handleSubmit = async (values: IntakeFormValues) => {
    setSubmittedLanguage(values.language)
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
        setSubmissionError('error')
        setSubmissionStatus('error')
        return
      }

      setReferenceId(result.referenceId || 'CAP-0000')
      setSubmissionStatus('success')
    } catch {
      setSubmissionError('networkError')
      setSubmissionStatus('error')
    }
  }

  if (submissionStatus === 'success') {
    const content = getContent(submittedLanguage)
    const { success } = content.submission

    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-4 text-3xl font-bold text-cap-primary">{success.heading}</h1>
          <p className="mb-4 text-base text-slate-700">{success.message}</p>
          <p className="mb-6 text-slate-700">{success.nextSteps}</p>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">{success.referenceNumberLabel}</p>
            <p className="mt-2 text-2xl font-bold text-cap-primary">{referenceId}</p>
          </div>

          <p className="mt-6 text-sm text-slate-600">{success.contactInfoReminder}</p>
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
        const content = getContent(values.language)

        if (submissionStatus === 'error') {
          const errorContent = submissionError === 'networkError' ? content.submission.networkError : content.submission.error

          return (
            <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h1 className="mb-4 text-3xl font-bold text-status-error">{errorContent.heading}</h1>
                <p className="mb-6 text-base text-slate-700">{errorContent.message}</p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button type="button" onClick={() => setSubmissionStatus('idle')}>
                    {errorContent.retryLabel}
                  </Button>
                  {submissionError === 'error' && (
                    <Link to="/intake">
                      <Button type="button" variant="outline">
                        {content.submission.error.contactLabel}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </main>
          )
        }

        const stepTitles = [
          content.intakeForm.stepLabels.zip,
          content.intakeForm.stepLabels.language,
          content.intakeForm.stepLabels.contact,
          content.intakeForm.stepLabels.documents,
        ]
        const totalSteps = stepTitles.length
        const stepMeta = {
          label: stepTitles[currentStep],
          stepNumber: currentStep + 1,
        }

        const handleNext = async () => {
          const stepErrors = validateStep(currentStep, values, content)
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

          await handleSubmit(values)
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
            setZipNotice(content.intakeForm.zip.notFoundMessage)
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
              <p className="text-sm font-medium uppercase tracking-wide text-slate-600">
                {content.intakeForm.navigation.progressLabel(stepMeta.stepNumber, totalSteps)}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-cap-primary">{stepMeta.label}</h1>
            </div>

            <Form className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.zip.label}</h2>

                  <FormField
                    label={content.intakeForm.contact.fields.zipCode.label}
                    htmlFor="zipCode"
                    error={touched.zipCode && errors.zipCode ? errors.zipCode : undefined}
                    hint={content.intakeForm.zip.hint}
                  >
                    <ZipInput
                      id="zipCode"
                      name="zipCode"
                      placeholder={content.intakeForm.zip.placeholder}
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
                    {content.intakeForm.zip.skipLabel}
                  </button>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.language.label}</h2>
                  <FormField
                    error={touched.language && errors.language ? errors.language : undefined}
                  >
                    <RadioGroup
                      name="language"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      options={[
                        { value: 'en', label: content.intakeForm.language.options.en },
                        { value: 'es', label: content.intakeForm.language.options.es },
                      ]}
                      isInvalid={Boolean(touched.language && errors.language)}
                    />
                  </FormField>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.contact.heading}</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={content.intakeForm.contact.fields.firstName.label} htmlFor="firstName" required error={touched.firstName && errors.firstName ? errors.firstName : undefined}>
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

                    <FormField label={content.intakeForm.contact.fields.lastName.label} htmlFor="lastName" required error={touched.lastName && errors.lastName ? errors.lastName : undefined}>
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
                    <FormField label={content.intakeForm.contact.fields.email.label} htmlFor="email" required error={touched.email && errors.email ? errors.email : undefined}>
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

                    <FormField label={content.intakeForm.contact.fields.phone.label} htmlFor="phone" error={touched.phone && errors.phone ? errors.phone : undefined}>
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

                  <FormField label={content.intakeForm.contact.fields.address1.label} htmlFor="streetAddress" required error={touched.streetAddress && errors.streetAddress ? errors.streetAddress : undefined}>
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

                  <FormField label={content.intakeForm.contact.fields.address2.label} htmlFor="apartment" error={touched.apartment && errors.apartment ? errors.apartment : undefined}>
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
                    <FormField label={content.intakeForm.contact.fields.city.label} htmlFor="city" required error={touched.city && errors.city ? errors.city : undefined}>
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

                    <FormField label={content.intakeForm.contact.fields.state.label} htmlFor="state" required error={touched.state && errors.state ? errors.state : undefined}>
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
                  <h2 className="text-2xl font-bold text-slate-900">{content.intakeForm.documents.heading}</h2>
                  <p className="text-base text-slate-700">{content.intakeForm.documents.description}</p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-800">{content.intakeForm.documents.examples.heading}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {content.intakeForm.documents.examples.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <label htmlFor="documents" className="block text-sm font-medium text-slate-800">
                      {content.intakeForm.documents.chooseFiles}
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
                    <p className="mt-3 text-xs text-slate-600">{content.intakeForm.documents.allowedTypesDescription}</p>
                    <p className="mt-1 text-xs text-slate-600">{content.intakeForm.documents.maxFileSizeWarning}</p>
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
                            {content.intakeForm.documents.remove}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">{content.intakeForm.documents.skipLabel}</p>
                    <button
                      type="button"
                      className="text-sm font-medium text-cap-primary underline underline-offset-2"
                      onClick={() => setFieldValue('documents', [])}
                    >
                      {content.intakeForm.documents.skipButtonLabel}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                  disabled={currentStep === 0}
                >
                  {content.intakeForm.navigation.back}
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    {content.intakeForm.navigation.continue}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext} disabled={submissionStatus === 'loading'}>
                    {submissionStatus === 'loading' ? content.submission.submitting.label : content.intakeForm.navigation.submit}
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

