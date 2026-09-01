import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Mobile package test configuration.
 *
 * Covers the pure, transport-neutral mobile modules (service config selection,
 * static ZIP lookup, upload adapters, id generation) without requiring a
 * simulator. `@cap/shared` is aliased to its TypeScript source, matching how
 * Metro resolves it at runtime.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@cap/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})