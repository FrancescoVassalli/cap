import { Form, Formik } from 'formik'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/forms/Button'
import { Container } from '@/components/layout'
import { IntakeProgress } from '@/components/navigation'
import { getContent } from '@/content'
import { INTAKE_STEP_COUNT, useIntakeNavigation } from '@/hooks/useIntakeNavigation'
import { useEveryActionSubmission } from '@/hooks/useEveryActionSubmission'
import { useZipLookup } from '@/hooks/useZipLookup'
import type { IntakeDocument, IntakeFormValues } from '@/types/index'
import { createIntakeSchema } from '@/validation/intakeSchema'
import { INTAKE_STEP_FIELDS, validateIntakeStep, type IntakeFieldErrors } from '@/validation/intakeStepValidation'
import { ContactStep } from './ContactStep'
import { DocumentsStep } from './DocumentsStep'
import { ErrorSummary, type ErrorSummaryEntry } from './ErrorSummary'
import { LanguageStep } from './LanguageStep'
import { SubmissionError } from './SubmissionError'
import { SubmissionSuccess } from './SubmissionSuccess'
import { ZipStep } from './ZipStep'

const TOTAL_STEPS = INTAKE_STEP_COUNT

function createInitialValues(): IntakeFormValues {
  return {
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
}

interface IntakeFormProps {
  intakeId: string
}

export function IntakeForm({ intakeId }: IntakeFormProps) {
  const { currentStep, goNext, goBack, canGoBack } = useIntakeNavigation(TOTAL_STEPS)
  const { lookup } = useZipLookup()
  const submission = useEveryActionSubmission()
  const { status: submissionStatus, errorKind, referenceId } = submission
  const [submittedLanguage, setSubmittedLanguage] = useState<'en' | 'es'>('en')
  const [zipNotice, setZipNotice] = useState('')
  const [triedToContinue, setTriedToContinue] = useState(false)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const languageRef = useRef<'en' | 'es'>('en')
  const errorSummaryFocusedRef = useRef(false)

  useEffect(() => {
    if (currentStep === 0) return
    stepHeadingRef.current?.focus()
  }, [currentStep])

  const submissionError: 'error' | 'networkError' = errorKind === 'networkError' ? 'networkError' : 'error'

  const handleSubmission = async (values: IntakeFormValues) => {
    setSubmittedLanguage(values.language)
    await submission.submit({ intakeId, ...values })
  }

  const handleRetry = () => {
    submission.reset()
  }

  if (submissionStatus === 'success') {
    return <SubmissionSuccess language={submittedLanguage} referenceId={referenceId} />
  }

  return (
    <Formik
      initialValues={createInitialValues()}
      validationSchema={() => createIntakeSchema(getContent(languageRef.current))}
      onSubmit={handleSubmission}
    >
      {({ values, touched, handleChange, handleBlur, setFieldValue, setFieldError, setTouched, validateForm }) => {
        languageRef.current = values.language
        const content = getContent(values.language)

        if (submissionStatus === 'error') {
          return <SubmissionError language={values.language} kind={submissionError} onRetry={handleRetry} />
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

        const fieldLabels: Record<string, string> = {
          zipCode: content.intakeForm.contact.fields.zipCode.label,
          language: content.intakeForm.language.label,
          firstName: content.intakeForm.contact.fields.firstName.label,
          lastName: content.intakeForm.contact.fields.lastName.label,
          email: content.intakeForm.contact.fields.email.label,
          phone: content.intakeForm.contact.fields.phone.label,
          streetAddress: content.intakeForm.contact.fields.address1.label,
          apartment: content.intakeForm.contact.fields.address2.label,
          city: content.intakeForm.contact.fields.city.label,
          state: content.intakeForm.contact.fields.state.label,
        }

        const focusTargets: Record<string, string> = {
          language: 'language-en',
        }

        const stepErrors: IntakeFieldErrors = validateIntakeStep(currentStep, values, content)

        const errorEntries: ErrorSummaryEntry[] = (Object.keys(stepErrors) as Array<keyof IntakeFormValues>).map(
          (field) => ({
            id: field,
            focusId: focusTargets[field] ?? field,
            label: fieldLabels[field] ?? field,
            message: stepErrors[field] ?? '',
          }),
        )
        const showErrorSummary = triedToContinue && errorEntries.length > 0

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

          const { location } = lookup(nextZip)
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

        const handleAddDocuments = (newDocuments: IntakeDocument[]) => {
          setFieldValue('documents', [...values.documents, ...newDocuments])
        }

        const handleRemoveDocument = (documentId: string) => {
          setFieldValue(
            'documents',
            values.documents.filter((document) => document.id !== documentId),
          )
        }

        const handleClearDocuments = () => {
          setFieldValue('documents', [])
        }

        const handleNext = async () => {
          if (Object.keys(stepErrors).length > 0) {
            ;(Object.keys(stepErrors) as Array<keyof IntakeFormValues>).forEach((field) => {
              setFieldError(field, stepErrors[field])
            })
            const touchedFields: Record<string, boolean> = {}
            Object.keys(stepErrors).forEach((field) => {
              touchedFields[field] = true
            })
            setTouched(touchedFields)
            errorSummaryFocusedRef.current = false
            setTriedToContinue(true)
            return
          }

          setTriedToContinue(false)

          if (currentStep < totalSteps - 1) {
            INTAKE_STEP_FIELDS[currentStep].forEach((field) => {
              setFieldError(field, undefined)
            })
            setZipNotice('')
            goNext()
            return
          }

          const fullErrors = await validateForm()
          if (Object.keys(fullErrors).length > 0) {
            const touchedFields: Record<string, boolean> = {}
            Object.keys(fullErrors).forEach((field) => {
              touchedFields[field] = true
            })
            setTouched(touchedFields)
            setTriedToContinue(true)
            return
          }

          await handleSubmission(values)
        }

        const handleBack = () => {
          setTriedToContinue(false)
          goBack()
        }

        return (
          <Container size="md" className="py-8 sm:py-10">
            <div className="mb-6 overflow-hidden rounded-2xl border border-cap-secondary/40 bg-white shadow-sm">
              <div className="border-b border-cap-secondary/40 bg-cap-secondary-50 px-4 py-3 sm:px-5">
                <IntakeProgress
                  current={stepMeta.stepNumber}
                  total={totalSteps}
                  progressText={content.intakeForm.navigation.progressLabel(stepMeta.stepNumber, totalSteps)}
                  ariaLabel={content.intakeForm.navigation.progressAriaLabel}
                />
              </div>
              <div className="px-4 pb-4 sm:px-5">
                <h1
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="mt-3 text-2xl font-bold text-cap-primary focus:outline-none focus:ring-2 focus:ring-cap-primary focus:ring-offset-2"
                >
                  {stepMeta.label}
                </h1>
              </div>
            </div>

            <Form className="space-y-6 rounded-2xl border border-cap-secondary/40 bg-white p-5 shadow-sm sm:p-8">
              {showErrorSummary && (
                <ErrorSummary
                  heading={content.intakeForm.errors.errorSummaryHeading}
                  entries={errorEntries}
                  autoFocus={!errorSummaryFocusedRef.current}
                  onAutoFocused={() => {
                    errorSummaryFocusedRef.current = true
                  }}
                />
              )}

              {currentStep === 0 && (
                <ZipStep
                  content={content}
                  values={values}
                  errors={stepErrors}
                  touched={touched}
                  zipNotice={zipNotice}
                  onZipChange={handleZipChange}
                  onBlur={handleBlur}
                />
              )}

              {currentStep === 1 && (
                <LanguageStep
                  content={content}
                  value={values.language}
                  errors={stepErrors}
                  touched={touched}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              )}

              {currentStep === 2 && (
                <ContactStep
                  content={content}
                  values={values}
                  errors={stepErrors}
                  touched={touched}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              )}

              {currentStep === 3 && (
                <DocumentsStep
                  content={content}
                  intakeId={intakeId}
                  documents={values.documents}
                  onAddDocuments={handleAddDocuments}
                  onRemoveDocument={handleRemoveDocument}
                  onClearDocuments={handleClearDocuments}
                />
              )}

              <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  disabled={!canGoBack || submissionStatus === 'loading'}
                >
                  {content.intakeForm.navigation.back}
                </Button>

                {currentStep < totalSteps - 1 ? (
                  <Button type="button" size="lg" onClick={handleNext}>
                    {content.intakeForm.navigation.continue}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNext}
                    disabled={submissionStatus === 'loading'}
                  >
                    {submissionStatus === 'loading'
                      ? content.submission.submitting.label
                      : content.intakeForm.navigation.submit}
                  </Button>
                )}
              </div>
            </Form>
          </Container>
        )
      }}
    </Formik>
  )
}