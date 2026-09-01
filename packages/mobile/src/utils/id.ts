/**
 * Small id helpers for the mobile app.
 *
 * The intake/session id must be a UUIDv4 so the backend's session-id gate
 * accepts it as the `Idempotency-Key`. The generation logic lives in the shared
 * package (`generateIntakeId`) so both platforms share the same id contract.
 * Ids are used only for session/client request ids and never as a security
 * boundary or for storing PHI.
 */

import { generateIntakeId } from '@cap/shared'

export function randomUUID(): string {
  return generateIntakeId()
}