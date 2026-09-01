/**
 * Intake flow context.
 *
 * A thin holder for the intake session id used during the form flow. Field
 * values are owned by Formik within the IntakeContent screen (mirroring the web
 * app). Transient user data lives only in React state and is never written to
 * logs, URLs, analytics, or persistent storage.
 */

import React, { createContext, useContext, useMemo } from 'react'

type IntakeContextValue = {
  intakeId: string
}

const IntakeContext = createContext<IntakeContextValue | undefined>(undefined)

export function IntakeProvider({
  intakeId,
  children,
}: {
  intakeId: string
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ intakeId }), [intakeId])
  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>
}

export function useIntake(): IntakeContextValue {
  const context = useContext(IntakeContext)
  if (!context) {
    throw new Error('useIntake must be used within an IntakeProvider')
  }
  return context
}
