import { test, expect, gotoAndWait } from './fixtures'
import { createTauriMockScript } from './tauri-mock'

/**
 * Batch 09 · Dashboard 仪表盘
 *
 * 验证清单（对应 README-verification.md）：
 * 1. Dashboard 页面正常显示
 * 2. 4 张统计卡片有数据（非全零）
 * 3. 月份选择器切换后数据更新
 * 4. ECharts 折线图正常渲染（近 6 个月）
 * 5. 盈亏趋势不使用买入/卖出总金额冒充盈亏
 * 6. ECharts 饼图正常渲染（仓位分布）
 * 7. 最近交易列表显示正确
 * 8. 活跃计划列表显示正确
 * 9. 无数据时显示空状态引导
 *
 * Mock 数据参考（tauri-mock.ts）：
 * - get_latest_position: { realizedPnl: 150000, unrealizedPnl: 500000, totalAssets: 10000000, cash: 2000000 }
 * - query_assets: 2 assets (510300 ETF, 510500 ETF)
 * - get_trade_summary: { currentQuantity: 500, realizedPnl: 552 }
 * - mockPositions: 1 snapshot at 2026-05-30
 * - mockTrades: 2 trades (buy 510300, buy 510500)
 * - mockPlans: 1 pending + 1 partial
 */

test.describe('Batch 09 · Dashboard 仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/dashboard')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────

  test('页面加载 — 标题、描述和月份选择器可见', async ({ page }) => {
    await expect(page.locator('.dashboard-page__title')).toHaveText('仪表盘')
    await expect(page.locator('.dashboard-page__description')).toHaveText(
      '投资组合概览与关键指标一览',
    )

    // 月份选择器
    await expect(page.locator('.n-date-picker')).toBeVisible()
  })

  // ── 2. 4 张统计卡片 ──────────────────────────────────────────

  test('统计卡片 — 4张卡片可见且有数据', async ({ page }) => {
    const stats = page.locator('.dashboard-page__stats .n-statistic')

    await expect(stats.filter({ hasText: '累计已实现盈亏' })).toBeVisible()
    await expect(stats.filter({ hasText: '浮动盈亏' })).toBeVisible()
    await expect(stats.filter({ hasText: '持仓标的数' })).toBeVisible()
    await expect(stats.filter({ hasText: '计划执行率' })).toBeVisible()

    // 验证非全零 — 累计已实现盈亏来自 get_latest_position().realizedPnl = 150000 fen
    // formatSignedMoney(150000) = "+¥1,500.00"
    const realizedStat = stats.filter({ hasText: '累计已实现盈亏' })
    await expect(realizedStat).toContainText('¥1,500.00')

    // 浮动盈亏 = 500000 fen → "+¥5,000.00"
    const unrealizedStat = stats.filter({ hasText: '浮动盈亏' })
    await expect(unrealizedStat).toContainText('¥5,000.00')

    // 持仓标的数 = 2（两个资产的 trade_summary 都有 currentQuantity > 0）
    const holdingStat = stats.filter({ hasText: '持仓标的数' })
    await expect(holdingStat).toContainText('2 个')
  })

  // ── 3. 盈亏格式化与颜色 ──────────────────────────────────────

  test('统计卡片 — 正数盈亏显示 "+" 前缀', async ({ page }) => {
    // 已实现盈亏正值 → "+¥1,500.00"
    const realizedStat = page.locator('.dashboard-page__stats .n-statistic').filter({
      hasText: '累计已实现盈亏',
    })
    await expect(realizedStat.locator('.n-statistic-value__content')).toContainText('+')

    // 浮动盈亏正值 → "+¥5,000.00"
    const unrealizedStat = page.locator('.dashboard-page__stats .n-statistic').filter({
      hasText: '浮动盈亏',
    })
    await expect(unrealizedStat.locator('.n-statistic-value__content')).toContainText('+')
  })

  // ── 4. 已实现盈亏来自仓位快照而非交易金额 ───────────────────

  test('统计卡片 — 已实现盈亏来自仓位快照，不使用交易金额', async ({ page }) => {
    // realizedPnl 来自 position snapshot = 150000 fen → ¥1,500.00
    // 交易 totalAmount = 1840000 fen → ¥18,400.00（不应出现在盈亏卡片中）
    const realizedStat = page.locator('.dashboard-page__stats .n-statistic').filter({
      hasText: '累计已实现盈亏',
    })
    await expect(realizedStat).toContainText('¥1,500.00')
    await expect(realizedStat).not.toContainText('18,400')
  })

  // ── 5. 计划执行率计算正确 ────────────────────────────────────

  test('统计卡片 — 计划执行率计算正确', async ({ page }) => {
    // mockPlans: 1 pending + 1 partial = 2 non-canceled
    // rate = (0 completed + 0.5 * 1 partial) / 2 * 10000 = 2500
    // formatPercent(2500) = "25.0%"
    const rateStat = page.locator('.dashboard-page__stats .n-statistic').filter({
      hasText: '计划执行率',
    })
    await expect(rateStat).toContainText('25.0%')
  })

  // ── 6. 月份选择器 ──────────────────────────────────────────

  test('月份选择器 — 可见且可交互', async ({ page }) => {
    const datePicker = page.locator('.n-date-picker')
    await expect(datePicker).toBeVisible()
    await expect(datePicker).toBeEnabled()

    // 点击打开面板，验证弹出层出现
    await datePicker.click()
    await page.waitForTimeout(500)

    // Naive UI 日期面板渲染为弹出层
    const panel = page.locator('.n-date-panel').filter({ hasText: /2026/ })
    await expect(panel).toBeVisible()
  })

  // ── 7. ECharts 盈亏趋势折线图 ──────────────────────────────

  test('盈亏趋势折线图 — ECharts Canvas 正常渲染', async ({ page }) => {
    const trendCard = page
      .locator('.dashboard-page__charts .n-card')
      .filter({ hasText: '近 6 个月盈亏趋势' })
    await expect(trendCard).toBeVisible()

    // ECharts 使用 CanvasRenderer 渲染
    const canvas = trendCard.locator('canvas')
    await expect(canvas).toBeVisible()

    // 验证 canvas 有实际尺寸（非零）
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  // ── 8. 盈亏趋势 — 多月份数据渲染 ────────────────────────────

  test('盈亏趋势折线图 — 多月份数据正常渲染', async ({ page }) => {
    // 通过 addInitScript 注入多月份数据（mockCommand 在导航后会被重置）
    await page.addInitScript(
      createTauriMockScript({
        get_positions: [
          {
            id: 1,
            snapshotAt: '2026-06-01T20:00:00.000Z',
            cash: 2000000,
            totalAssets: 10000000,
            unrealizedPnl: 500000,
            realizedPnl: 150000,
            createdAt: '2026-06-01T20:00:00.000Z',
            updatedAt: '2026-06-01T20:00:00.000Z',
          },
          {
            id: 2,
            snapshotAt: '2026-04-01T20:00:00.000Z',
            cash: 3000000,
            totalAssets: 9000000,
            unrealizedPnl: -200000,
            realizedPnl: 80000,
            createdAt: '2026-04-01T20:00:00.000Z',
            updatedAt: '2026-04-01T20:00:00.000Z',
          },
        ],
      }),
    )

    // 重新导航以加载多月份数据
    await gotoAndWait(page, '/dashboard')

    const trendCard = page
      .locator('.dashboard-page__charts .n-card')
      .filter({ hasText: '近 6 个月盈亏趋势' })
    await expect(trendCard).toBeVisible()
    await expect(trendCard.locator('canvas')).toBeVisible()
  })

  // ── 9. ECharts 仓位分布饼图 ──────────────────────────────

  test('仓位分布饼图 — ECharts Canvas 正常渲染', async ({ page }) => {
    const distCard = page
      .locator('.dashboard-page__charts .n-card')
      .filter({ hasText: '当前仓位分布' })
    await expect(distCard).toBeVisible()

    // ECharts 使用 CanvasRenderer 渲染
    const canvas = distCard.locator('canvas')
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  // ── 10. 最近交易列表 ────────────────────────────────────────

  test('最近交易列表 — 列头和数据渲染正确', async ({ page }) => {
    const tradesSection = page.locator('.dashboard-page__lists .n-card').filter({
      hasText: '最近交易',
    })
    await expect(tradesSection).toBeVisible()

    const table = tradesSection.locator('.n-data-table')
    const headers = ['时间', '标的', '类型', '金额']
    for (const h of headers) {
      await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
    }

    // mock: 2 trades sorted by tradeAt desc
    await expect(table.locator('tbody tr')).toHaveCount(2)

    // 第 1 行：510500 中证500ETF 买入 (tradeAt 2026-06-01)
    const row1 = table.locator('tbody tr').nth(0)
    await expect(row1).toContainText('510500')
    await expect(row1).toContainText('中证500ETF')

    // 第 2 行：510300 沪深300ETF 买入 (tradeAt 2026-05-30)
    const row2 = table.locator('tbody tr').nth(1)
    await expect(row2).toContainText('510300')
    await expect(row2).toContainText('沪深300ETF')

    // 类型列 — NTag 显示 "买入"
    const buyTag = row1.locator('.n-tag')
    await expect(buyTag).toContainText('买入')
  })

  // ── 11. 最近交易 — 金额格式化 ───────────────────────────────

  test('最近交易列表 — 金额显示千分位格式', async ({ page }) => {
    const table = page
      .locator('.dashboard-page__lists .n-card')
      .filter({ hasText: '最近交易' })
      .locator('.n-data-table')

    // mock trade 2: totalAmount=1860000 fen → formatSignedMoney = "+¥18,600.00"
    const row1 = table.locator('tbody tr').nth(0)
    const amountCell = row1.locator('td').last()
    await expect(amountCell).toContainText('¥18,600.00')
  })

  // ── 12. 活跃计划列表 ────────────────────────────────────────

  test('活跃计划列表 — 列头、状态标签和到期日正确', async ({ page }) => {
    const plansSection = page.locator('.dashboard-page__lists .n-card').filter({
      hasText: '活跃计划',
    })
    await expect(plansSection).toBeVisible()

    const table = plansSection.locator('.n-data-table')
    const headers = ['标的', '类型', '状态', '到期日']
    for (const h of headers) {
      await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
    }

    // mock: 2 active plans (pending + partial, sorted by createdAt desc)
    await expect(table.locator('tbody tr')).toHaveCount(2)

    // 第 1 行：510500 中证500ETF 卖出 部分执行 (partial, createdAt 2026-06-01)
    const row1 = table.locator('tbody tr').nth(0)
    await expect(row1).toContainText('510500')
    await expect(row1).toContainText('中证500ETF')

    // 状态 tag: partial → "部分执行"
    const statusTag = row1.locator('.n-tag').filter({ hasText: '部分执行' })
    await expect(statusTag).toBeVisible()

    // 到期日: 2026-07-15
    await expect(row1).toContainText('2026-07-15')

    // 第 2 行：510300 沪深300ETF 买入 待执行 (pending)
    const row2 = table.locator('tbody tr').nth(1)
    await expect(row2).toContainText('510300')
    const pendingTag = row2.locator('.n-tag').filter({ hasText: '待执行' })
    await expect(pendingTag).toBeVisible()

    // 到期日: 2026-06-30
    await expect(row2).toContainText('2026-06-30')
  })

  // ── 13. 空状态 — 无数据时显示引导 ────────────────────────────

  test('空状态 — 无数据时显示引导和新增标的按钮', async ({ page }) => {
    // 通过 addInitScript 注入空数据（mockCommand 在导航后会被重置）
    await page.addInitScript(
      createTauriMockScript({
        get_latest_position: null,
        get_positions: [],
        get_position_items: [],
        query_assets: [],
        query_trades: [],
        query_plans: [],
        get_trade_summary: {
          assetId: 0,
          totalBuyQuantity: 0,
          totalSellQuantity: 0,
          currentQuantity: 0,
          avgCost: 0,
          remainingCost: 0,
          realizedPnl: 0,
          totalBuyAmount: 0,
          totalSellAmount: 0,
        },
      }),
    )

    await gotoAndWait(page, '/dashboard')

    // 空状态显示
    await expect(page.locator('.n-empty')).toBeVisible()
    await expect(page.locator('.n-empty')).toContainText('欢迎使用 Invest Record Pro')
    await expect(page.getByRole('button', { name: '新增标的' })).toBeVisible()
  })

  // ── 14. 空状态 — 点击新增标的跳转到 Assets 页 ──────────────

  test('空状态 — 点击新增标的跳转到资产页面', async ({ page }) => {
    await page.addInitScript(
      createTauriMockScript({
        get_latest_position: null,
        get_positions: [],
        get_position_items: [],
        query_assets: [],
        query_trades: [],
        query_plans: [],
        get_trade_summary: {
          assetId: 0,
          totalBuyQuantity: 0,
          totalSellQuantity: 0,
          currentQuantity: 0,
          avgCost: 0,
          remainingCost: 0,
          realizedPnl: 0,
          totalBuyAmount: 0,
          totalSellAmount: 0,
        },
      }),
    )

    await gotoAndWait(page, '/dashboard')

    await page.getByRole('button', { name: '新增标的' }).click()
    await page.waitForURL('**/assets')
    await expect(page).toHaveURL(/\/assets/)
  })
})
