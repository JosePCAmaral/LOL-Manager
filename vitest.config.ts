import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
      '@persistence': fileURLToPath(new URL('./src/persistence', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@types-app': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
})
