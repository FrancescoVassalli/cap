import { useCallback, useState } from 'react'

export const INTAKE_STEP_COUNT = 4

export function useIntakeNavigation(totalSteps = INTAKE_STEP_COUNT) {
  const [currentStep, setCurrentStep] = useState(0)

  const goNext = useCallback(() => {
    setCurrentStep((step) => Math.min(totalSteps - 1, step + 1))
  }, [totalSteps])

  const goBack = useCallback(() => {
    setCurrentStep((step) => Math.max(0, step - 1))
  }, [])

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(Math.min(totalSteps - 1, Math.max(0, step)))
    },
    [totalSteps],
  )

  const canGoBack = currentStep > 0

  return { currentStep, goNext, goBack, goToStep, canGoBack }
}