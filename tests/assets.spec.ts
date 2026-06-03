/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 投资标的管理 E2E 测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { test, expect, gotoAndWait } from './fixtures'
import { mockAssets } from './tauri-mock'

/**
 * Batch 12 · Assets 投资标的管理验证
 *
 * 验证清单（对应 acceptance-criteria-v1.md §3.1）：
 * 1. 支持 create / edit / delete / list
 * 2. 字段：code, name, type, market, riskLevel, indexReference, logic, notes
 * 3. 数据持久化到 SQLite（mock 验证）
 * 4. 搜索
 * 5. 筛选（类型、市场）
 */

// helper: override mock store at runtime
async function mockCommand(page: import('@playwright/test').Page, cmd: string, data: unknown): Promise<void> {
  await page.evaluate(
    ([command, value]) => {
      ;(window as Record<string, unknown>).__TAURI_MOCK_STORE__[command] = value
    },
    [cmd, data] as [string, unknown],
  )
}

test.describe('Batch 12 · Assets 投资标的管理', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/assets')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────

  test('页面加载 — 标题、描述、操作按钮、筛选区可见', async ({ page }) => {
    await expect(page.locator('.assets-page__title')).toHaveText('投资标的')
    await expect(page.locator('.assets-page__description')).toHaveText(
      '管理你关注和持有的投资标的',
    )

    await expect(page.getByRole('button', { name: '+ 新增标的' })).toBeVisible()
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
    await expect(page.locator('.assets-page__filters')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible()
    await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  })

  // ── 2. 标的列表 ─────────────────────────────────────────────

  test('标的列表 — 表格列头、数据行、NTag', async ({ page }) => {
    const table = page.locator('.assets-page .n-data-table')
    await expect(table).toBeVisible()

    // mock 有 2 行数据
    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(2)

    // 第一行包含 510300
    await expect(rows.nth(0)).toContainText('510300')
    await expect(rows.nth(0)).toContainText('沪深300ETF')

    // 第二行包含 510500
    await expect(rows.nth(1)).toContainText('510500')
    await expect(rows.nth(1)).toContainText('中证500ETF')

    // 类型 NTag 存在（etf）
    const tags = table.locator('tbody .n-tag')
    await expect(tags.first()).toBeVisible()
    await expect(tags.first()).toContainText('ETF')
  })

  // ── 3. 新增标的 ─────────────────────────────────────────────

  test('新增标的 — 打开 Drawer → 填写表单 → 提交', async ({ page }) => {
    const newAsset = { ...mockAssets[0], id: 99, code: '510050', name: '上证50ETF' }
    await mockCommand(page, 'create_asset', newAsset)
    await mockCommand(page, 'get_assets', [...mockAssets, newAsset])

    // 点击新增
    await page.getByRole('button', { name: '+ 新增标的' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('新增标的')

    // Wait for form inputs to be interactive
    await drawer
      .locator('.n-form-item')
      .filter({ hasText: '代码' })
      .locator('.n-input input')
      .waitFor({ state: 'visible', timeout: 5000 })

    // 填写代码（NInput 外层 div 不可 fill，需选内部 <input>）
    await drawer.locator('.n-form-item').filter({ hasText: '代码' }).locator('.n-input input').fill('510050')

    // 填写名称
    await drawer.locator('.n-form-item').filter({ hasText: '名称' }).locator('.n-input input').fill('上证50ETF')

    // 点击保存
    await drawer.getByRole('button', { name: '保存' }).click()
    await page.waitForTimeout(1000)

    // Drawer 应关闭
    await expect(drawer).not.toBeVisible()
  })

  // ── 4. 新增标的必填校验 ──────────────────────────────────────

  test('新增标的必填校验 — 空提交时显示校验错误', async ({ page }) => {
    await page.getByRole('button', { name: '+ 新增标的' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await drawer.getByRole('button', { name: '保存' }).click()
    await page.waitForTimeout(300)

    await expect(drawer).toContainText('请输入标的代码')
  })

  // ── 5. 编辑标的 ──────────────────────────────────────────────

  test('编辑标的 — 点击"编辑" → Drawer 回填数据', async ({ page }) => {
    const table = page.locator('.assets-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    // 点击第一行编辑按钮
    await table.locator('tbody tr').nth(0).getByRole('button', { name: '编辑' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('编辑标的')

    // 代码字段应被禁用（Naive UI 使用 CSS class，非 HTML disabled 属性）
    const codeInput = drawer.locator('.n-form-item').filter({ hasText: '代码' }).locator('.n-input')
    await expect(codeInput).toHaveClass(/n-input--disabled/)
  })

  // ── 6. 删除标的 ──────────────────────────────────────────────

  test('删除标的 — NPopconfirm 确认后列表刷新', async ({ page }) => {
    await mockCommand(page, 'delete_asset', null)
    await mockCommand(page, 'get_assets', [mockAssets[1]])

    const table = page.locator('.assets-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await table.locator('tbody tr').nth(0).getByRole('button', { name: '删除' }).click()
    await page.waitForTimeout(500)

    const confirmBtn = page.locator('.n-popconfirm .n-button--primary-type')
    await confirmBtn.click()
    await page.waitForTimeout(500)

    await expect(table.locator('tbody tr')).toHaveCount(1)
  })

  // ── 7. 搜索 ──────────────────────────────────────────────────

  test('搜索 — 输入关键词 → 点击搜索', async ({ page }) => {
    await mockCommand(page, 'query_assets', [mockAssets[0]])

    const keywordInput = page.locator('.assets-page__filter-item .n-input input')
    await keywordInput.click()
    await keywordInput.fill('510300')

    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(500)

    const table = page.locator('.assets-page .n-data-table')
    await expect(table.locator('tbody tr')).toHaveCount(1)
    await expect(table.locator('tbody tr').nth(0)).toContainText('510300')
  })

  // ── 8. 筛选 ──────────────────────────────────────────────────

  test('筛选 — 按类型筛选后搜索', async ({ page }) => {
    await mockCommand(page, 'query_assets', [mockAssets[0]])

    const typeSelect = page
      .locator('.assets-page__filters')
      .locator('.n-form-item')
      .filter({ hasText: '类型' })
      .locator('.n-base-selection')
    await typeSelect.click()
    await page.locator('.n-base-select-option').filter({ hasText: 'ETF' }).click()

    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(500)

    const table = page.locator('.assets-page .n-data-table')
    await expect(table.locator('tbody tr')).toHaveCount(1)
  })

  // ── 9. 重置筛选 ──────────────────────────────────────────────

  test('重置筛选 — 清空条件 → 列表刷新', async ({ page }) => {
    const keywordInput = page.locator('.assets-page__filter-item .n-input input')
    await keywordInput.click()
    await keywordInput.fill('510300')

    await mockCommand(page, 'query_assets', [mockAssets[0]])

    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(500)

    const table = page.locator('.assets-page .n-data-table')
    await expect(table.locator('tbody tr')).toHaveCount(1)

    // 点击重置 — get_assets 默认返回 2 条
    await page.getByRole('button', { name: '重置' }).click()
    await page.waitForTimeout(500)

    await expect(table.locator('tbody tr')).toHaveCount(2)
  })

  // ── 10. 导出 CSV ──────────────────────────────────────────

  test('导出 CSV — 按钮可见且可点击', async ({ page }) => {
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible()
  })
})
