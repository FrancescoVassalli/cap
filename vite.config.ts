import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
      '@cap/shared': '/packages/shared/src/index.ts',
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': '/src',
            '@cap/shared': '/packages/shared/src/index.ts',
          },
        },
        test: {
          name: 'frontend',
          environment: 'jsdom',
          globals: true,
          setupFiles: './src/test/setup.ts',
          css: true,
          include: ['src/**/*.test.{ts,tsx}'],
          // Tests stay deterministic against the in-memory mock service even
          // when a developer has `.env.local` pointing the running dev server
          // at the live API (`VITE_CAP_SUBMISSION_MODE=api` / upload `s3`).
          // Vitest honors the Vite `.env.local` file by default, which would
          // otherwise make `IntakeForm` render time dial the real backend.
          env: {
            VITE_CAP_SUBMISSION_MODE: '',
            VITE_CAP_UPLOAD_MODE: '',
          },
        },
      },
      {
        resolve: {
          alias: {
            '@': '/src',
          },
        },
        test: {
          name: 'backend',
          environment: 'node',
          globals: true,
          setupFiles: './backend/test/setup.ts',
          include: ['backend/test/**/*.test.ts'],
        },
      },
    ],
  },
})
