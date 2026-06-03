/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: Playwright 测试公共 fixtures
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { test as base, expect, type Page } from '@playwright/test'
import { createTauriMockScript } from './tauri-mock'

/**
 * Navigate to a URL and wait for network idle.
 * Use instead of page.goto() for full page loads.
 */
export async function gotoAndWait(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('load')
  // Wait for Vue to mount, Pinia stores to resolve mock data, and DOM to update
  await page.waitForTimeout(1000)
}

/**
 * Extended Playwright test fixture with Tauri API mock.
 *
 * Usage:
 *   import { test, expect, gotoAndWait } from './fixtures'
 *
 *   test('my UI test', async ({ page }) => {
 *     await gotoAndWait(page, '/assets')
 *     // Tauri invoke calls are automatically mocked
 *   })
 *
 * To override specific mock data:
 *   test('with custom mock', async ({ page, mockCommand }) => {
 *     await mockCommand('get_assets', [])
 *     await gotoAndWait(page, '/assets')
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
