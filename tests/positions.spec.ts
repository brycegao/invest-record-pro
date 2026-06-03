/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 仓位快照页面 E2E 测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { test, expect, gotoAndWait } from './fixtures'

test.describe('Batch 06 · Positions 仓位快照', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/positions')
  })

  // ── 1. 页面加载与摘要卡片 ──────────────────────────────────────────

  test('页面加载 — 标题、描述和摘要卡片可见', async ({ page }) => {
    await expect(page.locator('.positions-page__title')).toHaveText('仓位快照')
    await expect(page.locator('.positions-page__description')).toHaveText(
      '查看历史仓位快照，并生成最新持仓数据',
    )

    const stats = page.locator('.n-statistic')
    await expect(stats.filter({ hasText: '总资产' })).toBeVisible()
    await expect(stats.filter({ hasText: '现金' })).toBeVisible()
    await expect(stats.filter({ hasText: '浮动盈亏' })).toBeVisible()
    await expect(stats.filter({ hasText: '已实现盈亏' })).toBeVisible()

    // mock: totalAssets=10000000 fen → ¥100,000.00
    await expect(stats.filter({ hasText: '总资产' })).toContainText('¥100,000.00')
    await expect(stats.filter({ hasText: '现金' })).toContainText('¥20,000.00')
    await expect(stats.filter({ hasText: '浮动盈亏' })).toContainText('+¥5,000.00')
  })

  // ── 2. 数据表格渲染 ────────────────────────────────────────────────

  test('数据表格 — 列头和操作按钮正确', async ({ page }) => {
    const table = page.locator('.n-data-table')

    const headers = ['快照时间', '现金', '总资产', '浮动盈亏', '已实现盈亏', '操作']
    for (const h of headers) {
      await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
    }

    await expect(table.locator('tbody tr')).toHaveCount(1)
    await expect(table.locator('tbody tr').first().getByRole('button', { name: '查看明细' })).toBeVisible()
    await expect(table.locator('tbody tr').first().getByRole('button', { name: '删除' })).toBeVisible()
  })

  // ── 3. 查看明细抽屉 ──────────────────────────────────────────────────

  test('查看明细 — Drawer 打开并显示持仓明细', async ({ page }) => {
    await page.getByRole('button', { name: '查看明细' }).first().click()

    // Naive UI NDrawer — 使用最后一个 .n-drawer-content（避免匹配残留元素）
    const drawerContent = page.locator('.n-drawer-content').last()
    await expect(drawerContent).toBeVisible()
    await expect(drawerContent.locator('.n-drawer-header__main')).toContainText('仓位明细')

    // 描述列表
    const descriptions = page.locator('.n-descriptions')
    await expect(descriptions).toBeVisible()
    await expect(descriptions).toContainText('快照日期')
    await expect(descriptions).toContainText('总资产')
    await expect(descriptions).toContainText('现金')
    await expect(descriptions).toContainText('持仓市值')

    // 明细表格 — wait for items to load async
    const detailTable = page.locator('.position-detail-drawer__table .n-data-table')
    await expect(detailTable.locator('tbody tr').first()).toBeVisible()
    await expect(detailTable.getByRole('columnheader', { name: '标的' })).toBeVisible()
    await expect(detailTable.getByRole('columnheader', { name: '仓位占比' })).toBeVisible()
  })

  // ── 4. 删除快照 ──────────────────────────────────────────────────────

  test('删除快照 — Popconfirm 确认后删除', async ({ page }) => {
    await page.getByRole('button', { name: '删除' }).first().click()
    await expect(page.getByText('确认删除该快照吗？此操作不可恢复。')).toBeVisible()
    await page.locator('.n-popconfirm .n-button--primary-type').click()
  })

  // ── 5. 生成快照抽屉 ──────────────────────────────────────────────────

  test('生成快照 — Drawer 打开并显示表单和持仓', async ({ page }) => {
    await page.getByRole('button', { name: '+ 生成快照' }).click()

    const drawerContent = page.locator('.n-drawer-content').last()
    await expect(drawerContent).toBeVisible()
    await expect(drawerContent.locator('.n-drawer-header__main')).toContainText('生成仓位快照')

    await expect(page.getByText('快照日期')).toBeVisible()
    await expect(page.getByPlaceholder('请输入总资产')).toBeVisible()
    await expect(page.getByPlaceholder('请输入现金')).toBeVisible()

    // 持仓区域
    await expect(page.locator('.holding-section')).toBeVisible()
    await expect(page.locator('.holding-table__header')).toContainText('标的')
    await expect(page.locator('.holding-table__header')).toContainText('当前价')
    await expect(page.locator('.holding-table__header')).toContainText('市值')

    await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
    await expect(page.getByRole('button', { name: '生成快照', exact: true })).toBeVisible()
  })

  // ── 6. 仓位占比计算正确 ───────────────────────────────────────────

  test('仓位占比 — 持仓明细中占比计算正确', async ({ page }) => {
    await page.getByRole('button', { name: '查看明细' }).first().click()

    const detailTable = page.locator('.position-detail-drawer__table .n-data-table')
    await expect(detailTable.locator('tbody tr').first()).toBeVisible()

    const row = detailTable.locator('tbody tr').first()

    // mock: marketValue=750000, totalAssets=10000000
    // ratio = 750000 / 10000000 = 0.075 → 7.5%
    const ratioCell = row.locator('td').last()
    await expect(ratioCell).toContainText('7.5%')

    // 验证市值：marketValue=750000 fen → ¥7,500.00
    const marketValueCell = row.locator('td').nth(4)
    await expect(marketValueCell).toContainText('¥7,500.00')

    // 验证浮动盈亏：unrealizedPnl=150000 → +¥1,500.00
    const pnlCell = row.locator('td').nth(5)
    await expect(pnlCell).toContainText('+¥1,500.00')
  })

  // ── 7. 浮动盈亏颜色 — 通过文本符号验证 ─────────────────────────────

  test('浮动盈亏 — 正值显示 "+" 前缀，负值显示 "-" 前缀', async ({ page }) => {
    // 浮动盈亏为正 → 显示 "+¥5,000.00"
    const unrealizedStat = page.locator('.n-statistic').filter({ hasText: '浮动盈亏' })
    await expect(unrealizedStat).toContainText('+¥5,000.00')

    // 已实现盈亏为正 → 显示 "+¥1,500.00"
    const realizedStat = page.locator('.n-statistic').filter({ hasText: '已实现盈亏' })
    await expect(realizedStat).toContainText('+¥1,500.00')
  })

  // ── 8. 市值验算：市值 = 当前价 × 持仓数量 ──────────────────────────────

  test('市值验算 — marketValue = Math.round(priceFen × quantityInt / 1000)', async ({ page }) => {
    await page.getByRole('button', { name: '查看明细' }).first().click()

    const detailTable = page.locator('.position-detail-drawer__table .n-data-table')
    await expect(detailTable.locator('tbody tr').first()).toBeVisible()

    const row = detailTable.locator('tbody tr').first()

    // mock 数据: marketValue=750000 fen → formatMoney = ¥7,500.00
    const marketValueCell = row.locator('td').nth(4)
    await expect(marketValueCell).toContainText('¥7,500.00')

    // 验证数量显示：quantity=5000 → displayQuantity(5000) = 5
    const quantityCell = row.locator('td').nth(1)
    await expect(quantityCell).toContainText('5')

    // 验证成本价：avgCost=1200 fen → fenToYuan(1200) = 12.00
    const costCell = row.locator('td').nth(2)
    await expect(costCell).toContainText('12.00')

    // 验证当前价：currentPrice=1500 fen → fenToYuan(1500) = 15.00
    const priceCell = row.locator('td').nth(3)
    await expect(priceCell).toContainText('15.00')
  })
})
