import { useParams, type NavigateFunction } from 'react-router-dom'
import { Button } from '@/components/forms/Button'
import { IntakeForm } from '@/components/intake/IntakeForm'

export function IntakePage() {
  const { id } = useParams<{ id: string }>()

  return <IntakeForm intakeId={id ?? ''} />
}

export function IntakeStartButton({ navigate, label }: { navigate: NavigateFunction; label: string }) {
  const beginIntake = () => {
    const intakeId = crypto.randomUUID()
    navigate(`/intake/${intakeId}`)
  }

  return (
    <Button type="button" onClick={beginIntake}>
      {label}
    </Button>
  )
}