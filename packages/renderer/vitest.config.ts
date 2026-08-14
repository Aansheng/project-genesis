import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@genesis/ai': resolve(__dirname, '../ai/src'),
      '@genesis/runtime': resolve(__dirname, '../runtime/src'),
      '@genesis/shared': resolve(__dirname, '../shared/src'),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'jsdom',
  },
})