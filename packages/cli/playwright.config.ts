import { defineConfig, devices } from '@playwright/test'

const workers = process.env.PLAYWRIGHT_WORKERS
  ? Number.isNaN(Number(process.env.PLAYWRIGHT_WORKERS))
    ? process.env.PLAYWRIGHT_WORKERS
    : Number(process.env.PLAYWRIGHT_WORKERS)
  : process.env.CI
    ? 4
    : '50%'

export default defineConfig({
  testDir: './tests-e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers,
  timeout: 10 * 60 * 1000,
  expect: {
    timeout: 20 * 1000,
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
})
