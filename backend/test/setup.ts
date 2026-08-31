import { Blob, File } from 'node:buffer'

/**
 * Vitest's node environment replaces the global Blob/File with a reduced
 * polyfill that undici's fetch cannot serialize as a request body (it has no
 * `stream()` method). Restore the native implementations so presigned-URL PUT
 * bodies behave the way real browser uploads do.
 */
Object.defineProperty(globalThis, 'Blob', {
  value: Blob,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'File', {
  value: File,
  writable: true,
  configurable: true,
})