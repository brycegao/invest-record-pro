/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: Playwright global setup — warm up Vite dev server before E2E tests
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { type FullConfig, chromium } from '@playwright/test'
import { createTauriMockScript } from './tauri-mock'

/**
 * Global setup runs once before all test files.
 * Navigates to the app with Tauri mock injected to trigger Vite module
 * compilation and caching so that subsequent tests load faster.
 *
 * Note: This does NOT fully eliminate cold-start flakiness in the first
 * test of each spec (browser context isolation means each test gets a
 * fresh context). The `retries: 1` in playwright.config.ts handles this.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL
  if (!baseURL) return

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.addInitScript(createTauriMockScript())
    await page.goto(baseURL)
    await page.waitForLoadState('load')

    // Wait for Vue to fully mount (sidebar = MainLayout shell)
    await page.waitForSelector('[role="menu"]', { timeout: 15000 })
  } finally {
    await browser.close()
  }
}

export default globalSetup
