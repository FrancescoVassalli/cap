import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': '/src',
          },
        },
        test: {
          name: 'frontend',
          environment: 'jsdom',
          globals: true,
          setupFiles: './src/test/setup.ts',
          css: true,
          include: ['src/**/*.test.{ts,tsx}'],
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
