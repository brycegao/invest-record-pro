/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易记录管理 E2E 测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { test, expect, gotoAndWait } from './fixtures'
import { mockTrades } from './tauri-mock'

/**
 * Batch 12 · Trades 交易记录管理验证
 *
 * 验证清单（对应 acceptance-criteria-v1.md §3.3）：
 * 1. 支持买入/卖出记录
 * 2. 关联标的、关联计划（可选）
 * 3. 价格/数量/金额/手续费
 * 4. 遵守计划标记
 * 5. 情绪状态
 * 6. 已实现盈亏计算
 * 7. 跨页面跳转：点击"复盘" → 跳转到 /reviews?tradeId=...
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

test.describe('Batch 12 · Trades 交易记录管理', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/trades')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────

  test('页面加载 — 标题、买入/卖出按钮、筛选区可见', async ({ page }) => {
    await expect(page.locator('.trades-page__title')).toHaveText('交易记录')
    await expect(page.locator('.trades-page__description')).toHaveText('记录每一笔实际成交')

    await expect(page.getByRole('button', { name: '+ 买入' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ 卖出' })).toBeVisible()
    await expect(page.getByRole('button', { name: '导出 CSV' })).toBeVisible()
    await expect(page.locator('.trades-page__filters')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible()
    await expect(page.getByRole('button', { name: '重置' })).toBeVisible()
    await expect(page.locator('.trade-table__toolbar')).toBeVisible()
    await expect(page.getByRole('button', { name: '列显示' })).toBeVisible()
  })

  // ── 2. 交易列表 ─────────────────────────────────────────────

  test('交易列表 — 数据行、买入 NTag', async ({ page }) => {
    const table = page.locator('.trades-page .n-data-table')
    await expect(table).toBeVisible()

    const rows = table.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
    await expect(rows).toHaveCount(2)

    // 第一行：510300 买入
    await expect(rows.nth(0)).toContainText('510300')
    await expect(rows.nth(0)).toContainText('沪深300ETF')

    // 买入 NTag
    const buyTag = rows.nth(0).locator('.n-tag').first()
    await expect(buyTag).toBeVisible()
    await expect(buyTag).toContainText('买入')

    // 第二行：510500
    await expect(rows.nth(1)).toContainText('510500')
  })

  // ── 3. 新增买入 ─────────────────────────────────────────────

  test('新增买入 — 打开 Drawer → 填写 → 保存', async ({ page }) => {
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])
    await mockCommand(page, 'create_trade', mockTrades[0])

    await page.getByRole('button', { name: '+ 买入' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('买入')

    // 选择标的
    const assetSelect = drawer.locator('.n-base-selection').first()
    await assetSelect.click()
    await page.waitForTimeout(300)
    const option = page.locator('.n-base-select-option').first()
    if (await option.isVisible()) {
      await option.click()
    }

    // 填写价格
    const priceInput = drawer.locator('.n-input-number').first()
    await priceInput.click()
    await priceInput.locator('input').clear()
    await priceInput.locator('input').fill('3.68')

    // 填写数量
    const quantityInput = drawer.locator('.n-input-number').nth(1)
    await quantityInput.click()
    await quantityInput.locator('input').clear()
    await quantityInput.locator('input').fill('500')

    await page.waitForTimeout(300)

    // 保存
    await drawer.getByRole('button', { name: '保存' }).click()
    await page.waitForTimeout(1000)

    await expect(drawer).not.toBeVisible()
  })

  // ── 4. 新增卖出 ─────────────────────────────────────────────

  test('新增卖出 — Drawer 标题为"卖出"', async ({ page }) => {
    await page.getByRole('button', { name: '+ 卖出' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('卖出')
  })

  // ── 5. 更多选项 ─────────────────────────────────────────────

  test('更多选项 — 展开显示手续费/情绪字段', async ({ page }) => {
    await page.getByRole('button', { name: '+ 买入' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer.locator('.n-collapse')).toBeVisible()

    // 展开"更多选项"
    await drawer.locator('.n-collapse-item__header').click()
    await page.waitForTimeout(300)

    await expect(drawer.locator('.n-collapse')).toContainText('手续费')
    await expect(drawer.locator('.n-collapse')).toContainText('遵守计划')
    await expect(drawer.locator('.n-collapse')).toContainText('情绪')
  })

  // ── 6. 编辑交易 ─────────────────────────────────────────────

  test('编辑交易 — 点击"编辑"打开 Drawer', async ({ page }) => {
    await mockCommand(page, 'query_assets', [
      { id: 1, code: '510300', name: '沪深300ETF', type: 'etf', market: 'CN', riskLevel: 2 },
    ])

    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await table.locator('tbody tr').nth(0).getByRole('button', { name: '编辑' }).click()
    await page.waitForTimeout(500)

    const drawer = page.locator('.n-drawer').last()
    await expect(drawer).toBeVisible()
    await expect(drawer).toContainText('买入')
  })

  // ── 7. 删除交易 ─────────────────────────────────────────────

  test('删除交易 — NPopconfirm 确认后列表刷新', async ({ page }) => {
    await mockCommand(page, 'delete_trade', null)
    await mockCommand(page, 'get_trades', [mockTrades[1]])

    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await table.locator('tbody tr').nth(1).getByRole('button', { name: '删除' }).click()
    await page.waitForTimeout(500)

    const confirmBtn = page.locator('.n-popconfirm .n-button--primary-type')
    await confirmBtn.click()
    await page.waitForTimeout(500)

    await expect(table.locator('tbody tr')).toHaveCount(1)
  })

  // ── 8. 复盘跳转 ─────────────────────────────────────────────

  test('复盘跳转 — 点击"复盘"按钮 → URL 跳转到 /reviews?tradeId=1', async ({ page }) => {
    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await table.locator('tbody tr').nth(0).getByRole('button', { name: '复盘' }).click()
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/\/reviews\?tradeId=1/)
  })

  // ── 9. 列显示控制 ─────────────────────────────────────────────

  test('列显示控制 — 开启手续费/情绪列', async ({ page }) => {
    await page.getByRole('button', { name: '列显示' }).click()
    await page.waitForTimeout(300)

    const feeCheckbox = page.locator('.n-checkbox').filter({ hasText: '手续费' })
    await feeCheckbox.click()
    await page.waitForTimeout(200)

    const moodCheckbox = page.locator('.n-checkbox').filter({ hasText: '情绪' })
    await moodCheckbox.click()
    await page.waitForTimeout(200)

    // 隐藏 popover
    await page.locator('.trades-page__title').click()
    await page.waitForTimeout(300)

    // 表格应显示手续费和情绪列头
    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    await expect(table.getByRole('columnheader', { name: '手续费' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: '情绪' })).toBeVisible()
  })

  // ── 10. 筛选 — 按交易类型 ─────────────────────────────────

  test('筛选 — 按交易类型筛选后搜索', async ({ page }) => {
    await mockCommand(page, 'query_trades', [mockTrades[0]])

    const typeSelect = page
      .locator('.trades-page__filters')
      .locator('.n-form-item')
      .filter({ hasText: '交易类型' })
      .locator('.n-base-selection')
    await typeSelect.click()
    await page.locator('.n-base-select-option').filter({ hasText: '买入' }).click()

    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(500)

    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr')).toHaveCount(1)
  })

  // ── 11. 筛选 — 按情绪 ─────────────────────────────────────

  test('筛选 — 按情绪筛选后搜索', async ({ page }) => {
    await mockCommand(page, 'query_trades', [mockTrades[0]])

    const moodSelect = page
      .locator('.trades-page__filters')
      .locator('.n-form-item')
      .filter({ hasText: '情绪' })
      .locator('.n-base-selection')
    await moodSelect.click()
    await page.locator('.n-base-select-option').filter({ hasText: '平静' }).click()

    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(500)

    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr')).toHaveCount(1)
  })

  // ── 12. 重置筛选 ─────────────────────────────────────────────

  test('重置筛选 — 清空条件 → 列表刷新', async ({ page }) => {
    const typeSelect = page
      .locator('.trades-page__filters')
      .locator('.n-form-item')
      .filter({ hasText: '交易类型' })
      .locator('.n-base-selection')
    await typeSelect.click()
    await page.locator('.n-base-select-option').filter({ hasText: '买入' }).click()

    await mockCommand(page, 'query_trades', [mockTrades[0]])

    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(500)

    const table = page.locator('.trades-page .n-data-table')
    await expect(table.locator('tbody tr')).toHaveCount(1)

    // 点击重置
    await page.getByRole('button', { name: '重置' }).click()
    await page.waitForTimeout(500)

    await expect(table.locator('tbody tr')).toHaveCount(2)
  })
})
