import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setupVitest.js'],
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
  },
})
