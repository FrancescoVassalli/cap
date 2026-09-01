/**
 * Small id helpers for the mobile app.
 *
 * `crypto.randomUUID` may not be globally available in all native JS runtimes,
 * so we guard with a fallback. Ids are used only for session/client request ids
 * and never as a security boundary or for storing PHI.
 */

export function randomUUID(): string {
  const c = globalThis as { crypto?: { randomUUID?: () => string } }
  if (c.crypto && typeof c.crypto.randomUUID === 'function') {
    return c.crypto.randomUUID()
  }
  // Deterministic-quality fallback for runtimes without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}
