import { Navigate, useParams } from 'react-router-dom'
import { IntakeForm } from '@/components/intake/IntakeForm'
import { isValidIntakeId } from './intakeId'

export function IntakePage() {
  const { id } = useParams<{ id: string }>()

  if (!isValidIntakeId(id)) {
    return <Navigate to="/intake" replace />
  }

  return <IntakeForm intakeId={id} />
}
