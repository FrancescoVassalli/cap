import { randomBytes } from 'node:crypto'
import { json } from '../http.js'
import type { RouteHandler } from '../router.js'
import { validateIntakeForm } from '../validation/intake.js'
import type { IntakeLogEntry, IntakeRecord } from '../repository/store.js'

const INTAKE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STORED_FIELDS = [
  'FirstName',
  'LastName',
  'EmailAddress',
  'City',
  'HomePhone',
  'PreferredLanguages',
  'PostalCode',
  'AddressLine1',
] as const

/**
 * The intake id doubles as the browser-session identifier: it is generated
 * client-side with `crypto.randomUUID()` and sent back as the idempotency key.
 * Rejecting anything that is not a well-formed session id keeps stale or
 * forged sessions from reaching the durable store.
 */
export function isValidIntakeId(value: string): boolean {
  return INTAKE_ID_RE.test(value)
}

export function generateReferenceId(): string {
  const bytes = randomBytes(4).toString('hex').toUpperCase()
  return `CAP-${bytes.slice(0, 4)}-${bytes.slice(4)}`
}

function buildStoredFields(form: URLSearchParams): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const key of STORED_FIELDS) {
    const value = (form.get(key) ?? '').trim()
    if (value) fields[key] = value
  }
  return fields
}

/**
 * Captures the complete submitted form input verbatim. Unlike `buildStoredFields`,
 * this retains every posted field (consumer data plus metadata markers) because
 * it is the durable audit log — it never feeds the PHI-free stdout logger.
 */
function buildFullFormInput(form: URLSearchParams): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    const trimmed = value.trim()
    if (trimmed) fields[key] = trimmed
  }
  return fields
}

export const createIntake: RouteHandler = async (request, deps) => {
  const key = request.headers['idempotency-key'] ?? ''
  if (!isValidIntakeId(key)) {
    return json(401, {
      error: { code: 'session_expired', message: 'This intake session has expired.' },
    })
  }

  const existing = await deps.store.getIntakeByIntakeId(key)
  if (existing) {
    deps.logger.log('info', 'intake-replayed', {
      intakeId: key,
      referenceId: existing.referenceId,
    })
    return json(200, { referenceId: existing.referenceId })
  }

  if (request.body === null) {
    return json(422, { errors: { form: 'A submission body is required.' } })
  }

  const form = new URLSearchParams(request.body)
  const errors = validateIntakeForm(form)
  if (Object.keys(errors).length > 0) return json(422, { errors })

  const record: IntakeRecord = {
    intakeId: key,
    referenceId: generateReferenceId(),
    sourceChannel: 'web',
    formSessionId: (form.get('FormSessionId') ?? '').trim(),
    clientSubmissionId: (form.get('ClientSubmissionId') ?? '').trim(),
    receivedAt: new Date().toISOString(),
    fields: buildStoredFields(form),
  }

  await deps.store.createIntake(record)

  // Write the received form input to the durable intake audit log. This is the
  // "write the form input to a log" step: it records exactly what was submitted
  // in the store (inspectable via `getIntakeLog`), keeping the PHI-free stdout
  // logger clean. Only first-time submissions are logged; idempotent replays
  // return early above and never duplicate the entry.
  const logEntry: IntakeLogEntry = {
    id: `${record.intakeId}-${record.receivedAt}`,
    intakeId: record.intakeId,
    sourceChannel: record.sourceChannel,
    receivedAt: record.receivedAt,
    fields: buildFullFormInput(form),
  }
  await deps.store.appendIntakeLog(logEntry)

  deps.logger.log('info', 'intake-accepted', {
    intakeId: record.intakeId,
    referenceId: record.referenceId,
  })
  return json(201, { referenceId: record.referenceId })
}