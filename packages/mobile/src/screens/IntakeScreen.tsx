/**
 * Intake flow screen.
 *
 * Orchestrates the multi-step native intake: ZIP -> Language -> Contact ->
 * Documents -> Review -> Submit. Uses Formik for form state (mirroring the web
 * app), shared step validation rules, and the service adapters for submission
 * and document upload. No sensitive values are logged, URL-encoded into
 * parameters, or persisted.
 */

import React, { useMemo, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Formik } from 'formik'
import type { IntakeFormValues } from '@cap/shared'
import { validateIntakeStep, type IntakeFieldErrors } from '@cap/shared'
import { StepShell } from '../components/StepShell'
import { IntakeProvider, useIntake } from '../context/IntakeContext'
import { getContent, useLanguage } from '../context/ContentContext'
import { ZipStep } from '../components/intake/ZipStep'
import { LanguageStep } from '../components/intake/LanguageStep'
import { ContactStep } from '../components/intake/ContactStep'
import { DocumentsStep } from '../components/intake/DocumentsStep'
import { ReviewStep } from '../components/intake/ReviewStep'
import { SubmissionScreen } from './SubmissionScreen'
import { mobileServices } from '../services'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Intake'>

const EMPTY_VALUES: IntakeFormValues = {
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

function IntakeContent({ navigation }: { navigation: Props['navigation'] }) {
  const content = getContent()
  const { language } = useLanguage()
  const { intakeId } = useIntake()
  const [step, setStep] = useState(0)
  const stepRef = React.useRef(0)
  stepRef.current = step
  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<
    'idle' | 'success' | 'error' | 'submitting'
  >('idle')
  const [errorKind, setErrorKind] = useState<'error' | 'networkError' | 'sessionExpired'>('error')
  const [referenceId, setReferenceId] = useState<string | undefined>(undefined)
  const [runKey, setRunKey] = useState(0)
  const [lastContinueErrors, setLastContinueErrors] = useState<IntakeFieldErrors>({})

  const validateStep = (stepIndex: number, vals: IntakeFormValues): IntakeFieldErrors =>
    validateIntakeStep(stepIndex, vals, content.intakeForm.errors)

  const submit = async (vals: IntakeFormValues) => {
    setSubmitting(true)
    setSubmitState('submitting')
    const payload = {
      intakeId,
      zipCode: vals.zipCode || undefined,
      language: vals.language,
      firstName: vals.firstName,
      lastName: vals.lastName,
      email: vals.email,
      phone: vals.phone || undefined,
      streetAddress: vals.streetAddress,
      apartment: vals.apartment || undefined,
      city: vals.city,
      state: vals.state,
      documents: vals.documents,
    }
    try {
      const result = await mobileServices.submission.submit(payload)
      if (result.success) {
        for (const document of vals.documents) {
          await mobileServices.documentUpload.upload(
            { name: document.name, size: document.size, type: document.type },
            intakeId,
          )
        }
        setReferenceId(result.referenceId)
        setSubmitState('success')
      } else {
        setErrorKind(result.errorKind ?? 'error')
        setSubmitState('error')
      }
    } catch (e) {
      if (e instanceof Error && 'kind' in e) {
        setErrorKind((e as { kind: 'error' | 'networkError' | 'sessionExpired' }).kind)
      } else {
        setErrorKind('networkError')
      }
      setSubmitState('error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinue = (vals: IntakeFormValues) => {
    if (step === 4) {
      const errors = validateStep(5, vals)
      if (Object.keys(errors).length > 0) {
        setStep(2)
        return
      }
      void submit(vals)
      return
    }
    const errors = validateStep(step, vals)
    if (Object.keys(errors).length > 0) {
      setLastContinueErrors(errors)
      return
    }
    setLastContinueErrors({})
    setStep((s) => s + 1)
  }

  const restart = () => {
    setStep(0)
    setSubmitState('idle')
    setErrorKind('error')
    setLastContinueErrors({})
    setRunKey((k) => k + 1)
  }

  if (submitState === 'success') {
    return (
      <SubmissionScreen
        kind="success"
        referenceId={referenceId}
        language={language}
        onFinish={() => navigation.popToTop()}
      />
    )
  }

  if (submitState === 'error') {
    return (
      <SubmissionScreen
        kind={errorKind}
        onRetry={() => {
          setStep(4)
          setSubmitState('idle')
        }}
        onRestart={restart}
      />
    )
  }

  return (
    <Formik
      key={runKey}
      initialValues={EMPTY_VALUES}
      onSubmit={() => {}}
      validateOnBlur={true}
      validate={(vals) => {
        // Recompute the current step's errors freshly so errors clear as the
        // user fixes fields, merged with any errors that blocked a Continue.
        const activeStep = stepRef.current
        const fresh = activeStep === 4 ? {} : validateStep(activeStep, vals)
        return { ...lastContinueErrors, ...fresh }
      }}
    >
      {({ values: formikValues }) => (
        <StepShell
          stepIndex={step}
          onBack={step > 0 ? () => setStep((s) => Math.max(0, s - 1)) : undefined}
          onContinue={() => handleContinue(formikValues)}
          continueLabel={step === 4 ? content.intakeForm.navigation.submit : undefined}
          continueLoading={submitting}
          continueDisabled={submitting}
          hideBack={step === 0}
        >
          {renderStep(step)}
        </StepShell>
      )}
    </Formik>
  )

  function renderStep(currentStep: number) {
    switch (currentStep) {
      case 0:
        return <ZipStep />
      case 1:
        return <LanguageStep />
      case 2:
        return <ContactStep />
      case 3:
        return <DocumentsStep />
      case 4:
        return <ReviewStep onEditStep={(target) => setStep(target)} />
      default:
        return null
    }
  }
}

export function IntakeScreen({ route, navigation }: Props) {
  const intakeId = route.params?.intakeId ?? `cap-${Date.now()}`

  return (
    <IntakeProvider intakeId={intakeId}>
      <IntakeContent navigation={navigation} />
    </IntakeProvider>
  )
}
