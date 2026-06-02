import { test as base, expect } from '@playwright/test'
import { createTauriMockScript, type defaultMockStore } from './tauri-mock'

/**
 * Extended Playwright test fixture with Tauri API mock.
 *
 * Usage:
 *   import { test, expect } from './fixtures'
 *
 *   test('my UI test', async ({ page }) => {
 *     await page.goto('/assets')
 *     // Tauri invoke calls are automatically mocked
 *   })
 *
 * To override specific mock data:
 *   test('with custom mock', async ({ page, mockCommand }) => {
 *     await mockCommand('get_assets', [])
 *     await page.goto('/assets')
 *   })
 */
type TestFixtures = {
  /** Override a specific Tauri command's mock return value at runtime */
  mockCommand: (cmd: string, data: unknown) => Promise<void>
}

export const test = base.extend<TestFixtures>({
  mockCommand: async ({ page }, use) => {
    await use(async (cmd: string, data: unknown) => {
      await page.evaluate(
        ([command, value]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(window as any).__TAURI_MOCK_STORE__[command] = value
        },
        [cmd, data],
      )
    })
  },
})

// Inject Tauri mock into every page before load
test.beforeEach(async ({ page }) => {
  await page.addInitScript(createTauriMockScript())
})

export { expect }
