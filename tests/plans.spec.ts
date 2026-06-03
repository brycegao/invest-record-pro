/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易计划管理 E2E 测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { test, expect, gotoAndWait } from './fixtures'
import { mockPlans } from './tauri-mock'

/**
 * Batch 12 · Plans 交易计划管理验证
 *
 * 验证清单（对应 acceptance-criteria-v1.md §3.2）：
 * 1. 支持买入/卖出计划
 * 2. 支持触发条件（plan_rules）
 * 3. 计划仓位、有效期
 * 4. 状态流转：pending → partial → completed → canceled
 * 5. 关联标的
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

test.describe('Batch 12 · Plans 交易计划管理', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/plans')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────

  test('页面加载 — 标题、2 个新增按钮、筛选区可见', async ({ page }) => {
    await expect(page.locator('.plans-page__title')).toHaveText('交易计划')
    await expect(page.locator('.plans-page__description')).toHaveText(
      '创建和管理你的买入/卖出计划',
    )

    await expect(page.getByRole('button', { name: '+ 新增买入计划' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ 新增卖出计划' })).toBeVisible()
    await expect(page.locator('.plans-page__filters')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible()
    await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
  })

  // ── 2. 计划列表 ─────────────────────────────────────────────

  test('计划列表 — 数据行、类型/状态 NTag', async ({ page }) => {
    const table = page.locator('.plans-page .n-data-table')
    await expect(table).toBeVisible()

    const rows = table.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    await expect(rows).toHaveCount(2)

    // 第一行：买入计划，含标的代码
    await expect(rows.nth(0)).toContainText('510300')
    await expect(rows.nth(0)).toContainText('沪深300ETF')

    // 类型 NTag 存在
    const typeTags = rows.nth(0).locator('.n-tag')
    await expect(typeTags.first()).toBeVisible()

    // 状态 NTag 存在
    await expect(rows.nth(0).locator('.n-tag').last()).toBeVisible()

    // 第二行：卖出计划
    await expect(rows.nth(1)).toContainText('510500')
  })

  // ── 3. 新增买入计划 ──────────────────────────────────────────

  test('新增买入计划 — 打开 Drawer → 标题正确 → 保存', async ({ page }) => {
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])
    await mockCommand(page, 'create_plan', mockPlans[0])

    await page.getByRole('button', { name: '+ 新增买入计划' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('新增买入计划')

    // 选择标的
    const assetSelect = drawer.locator('.n-base-selection').first()
    await assetSelect.click()
    await page.waitForTimeout(300)
    const option = page.locator('.n-base-select-option').first()
    if (await option.isVisible()) {
      await option.click()
    }

    // 保存
    await drawer.getByRole('button', { name: '保存' }).click()
    await page.waitForTimeout(1000)

    await expect(drawer).not.toBeVisible()
  })

  // ── 4. 新增卖出计划 ──────────────────────────────────────────

  test('新增卖出计划 — Drawer 标题为"新增卖出计划"', async ({ page }) => {
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])

    await page.getByRole('button', { name: '+ 新增卖出计划' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('新增卖出计划')
  })

  // ── 5. 编辑计划 ──────────────────────────────────────────────

  test('编辑计划 — pending 状态可编辑', async ({ page }) => {
    await mockCommand(page, 'get_plan_rules', [])
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])

    const table = page.locator('.plans-page .n-data-table')
    await table.locator('tbody tr').nth(0).getByRole('button', { name: '编辑' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('编辑计划')
  })

  // ── 6. 作废计划 ──────────────────────────────────────────────

  test('作废计划 — pending 状态显示"作废"按钮', async ({ page }) => {
    const table = page.locator('.plans-page .n-data-table')

    // 第一行是 pending 状态，应显示"作废"按钮
    await expect(table.locator('tbody tr').nth(0).getByRole('button', { name: '作废' })).toBeVisible()
  })

  // ── 7. 删除计划 ──────────────────────────────────────────────

  test('删除计划 — NPopconfirm 确认后列表刷新', async ({ page }) => {
    await mockCommand(page, 'delete_plan', null)
    await mockCommand(page, 'get_plans', [mockPlans[1]])

    const table = page.locator('.plans-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await table.locator('tbody tr').nth(1).getByRole('button', { name: '删除' }).click()
    await page.waitForTimeout(500)

    const confirmBtn = page.locator('.n-popconfirm .n-button--primary-type')
    await confirmBtn.click()
    await page.waitForTimeout(500)

    await expect(table.locator('tbody tr')).toHaveCount(1)
  })

  // ── 8. 添加规则 ──────────────────────────────────────────────

  test('添加规则 — 点击"+ 添加规则" → 规则行出现', async ({ page }) => {
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])

    await page.getByRole('button', { name: '+ 新增买入计划' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await drawer.getByRole('button', { name: '+ 添加规则' }).click()
    await page.waitForTimeout(300)

    const rules = drawer.locator('.plan-form__rule')
    await expect(rules).toHaveCount(1)
  })

  // ── 9. 删除规则 ──────────────────────────────────────────────

  test('删除规则 — 点击规则行"删除"按钮后消失', async ({ page }) => {
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])

    await page.getByRole('button', { name: '+ 新增买入计划' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await drawer.getByRole('button', { name: '+ 添加规则' }).click()
    await drawer.getByRole('button', { name: '+ 添加规则' }).click()
    await page.waitForTimeout(300)

    const rules = drawer.locator('.plan-form__rule')
    await expect(rules).toHaveCount(2)

    await rules.nth(0).getByRole('button', { name: '删除' }).click()
    await page.waitForTimeout(200)

    await expect(rules).toHaveCount(1)
  })

  // ── 10. 状态按钮可见性 ──────────────────────────────────────

  test('状态按钮可见性 — pending 显示编辑+作废，partial 仅显示编辑', async ({ page }) => {
    const table = page.locator('.plans-page .n-data-table')

    // 第一行 pending：编辑 + 作废 + 删除
    const row1 = table.locator('tbody tr').nth(0)
    await expect(row1.getByRole('button', { name: '编辑' })).toBeVisible()
    await expect(row1.getByRole('button', { name: '作废' })).toBeVisible()
    await expect(row1.getByRole('button', { name: '删除' })).toBeVisible()

    // 第二行 partial：编辑 + 删除（无作废）
    const row2 = table.locator('tbody tr').nth(1)
    await expect(row2.getByRole('button', { name: '编辑' })).toBeVisible()
    await expect(row2.getByRole('button', { name: '删除' })).toBeVisible()
    await expect(row2.getByRole('button', { name: '作废' })).not.toBeVisible()
  })
})
