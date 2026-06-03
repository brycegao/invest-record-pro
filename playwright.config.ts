import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  fullyParallel: false,
  workers: 1,
  // Warm up Vite dev server before any test runs to avoid cold-start flakiness
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:1420',
    viewport: { width: 1280, height: 800 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    actionTimeout: 10000,
    // Capture trace on retry for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchArgs: ['--lang=zh-CN'],
      },
    },
  ],
  // Auto-start Vite dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:1420',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
