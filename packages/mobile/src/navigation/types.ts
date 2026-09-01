/**
 * Shared navigation param types for the CAP mobile app.
 */

import type { Language, IntakeFormValues } from '@cap/shared'

export type RootStackParamList = {
  Home: undefined
  IntakeLanding: undefined
  Intake:
    | undefined
    | {
        intakeId?: string
        initialValues?: Partial<IntakeFormValues>
      }
  Success:
    | {
        referenceId?: string
        language: Language
      }
    | undefined
}
