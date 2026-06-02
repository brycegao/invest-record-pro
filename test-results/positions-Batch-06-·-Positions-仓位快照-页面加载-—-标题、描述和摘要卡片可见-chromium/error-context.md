# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: positions.spec.ts >> Batch 06 · Positions 仓位快照 >> 页面加载 — 标题、描述和摘要卡片可见
- Location: tests/positions.spec.ts:10:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.n-statistic').filter({ hasText: '总资产' })
Expected substring: "¥100,000.00"
Received string:    "总资产¥0.00"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.n-statistic').filter({ hasText: '总资产' })
    14 × locator resolved to <div data-v-38dbc505="" class="n-statistic">…</div>
       - unexpected value "总资产¥0.00"

```

```yaml
- text: 总资产 ¥0.00
```

# Test source

```ts
  1   | import { test, expect, gotoAndWait } from './fixtures'
  2   | 
  3   | test.describe('Batch 06 · Positions 仓位快照', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await gotoAndWait(page, '/positions')
  6   |   })
  7   | 
  8   |   // ── 1. 页面加载与摘要卡片 ──────────────────────────────────────────
  9   | 
  10  |   test('页面加载 — 标题、描述和摘要卡片可见', async ({ page }) => {
  11  |     await expect(page.locator('.positions-page__title')).toHaveText('仓位快照')
  12  |     await expect(page.locator('.positions-page__description')).toHaveText(
  13  |       '查看历史仓位快照，并生成最新持仓数据',
  14  |     )
  15  | 
  16  |     const stats = page.locator('.n-statistic')
  17  |     await expect(stats.filter({ hasText: '总资产' })).toBeVisible()
  18  |     await expect(stats.filter({ hasText: '现金' })).toBeVisible()
  19  |     await expect(stats.filter({ hasText: '浮动盈亏' })).toBeVisible()
  20  |     await expect(stats.filter({ hasText: '已实现盈亏' })).toBeVisible()
  21  | 
  22  |     // mock: totalAssets=10000000 fen → ¥100,000.00
> 23  |     await expect(stats.filter({ hasText: '总资产' })).toContainText('¥100,000.00')
      |                                                    ^ Error: expect(locator).toContainText(expected) failed
  24  |     await expect(stats.filter({ hasText: '现金' })).toContainText('¥20,000.00')
  25  |     await expect(stats.filter({ hasText: '浮动盈亏' })).toContainText('+¥5,000.00')
  26  |   })
  27  | 
  28  |   // ── 2. 数据表格渲染 ────────────────────────────────────────────────
  29  | 
  30  |   test('数据表格 — 列头和操作按钮正确', async ({ page }) => {
  31  |     const table = page.locator('.n-data-table')
  32  | 
  33  |     const headers = ['快照时间', '现金', '总资产', '浮动盈亏', '已实现盈亏', '操作']
  34  |     for (const h of headers) {
  35  |       await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
  36  |     }
  37  | 
  38  |     await expect(table.locator('tbody tr')).toHaveCount(1)
  39  |     await expect(table.locator('tbody tr').first().getByRole('button', { name: '查看明细' })).toBeVisible()
  40  |     await expect(table.locator('tbody tr').first().getByRole('button', { name: '删除' })).toBeVisible()
  41  |   })
  42  | 
  43  |   // ── 3. 查看明细抽屉 ──────────────────────────────────────────────────
  44  | 
  45  |   test('查看明细 — Drawer 打开并显示持仓明细', async ({ page }) => {
  46  |     await page.getByRole('button', { name: '查看明细' }).first().click()
  47  | 
  48  |     // Naive UI NDrawer — 使用最后一个 .n-drawer-content（避免匹配残留元素）
  49  |     const drawerContent = page.locator('.n-drawer-content').last()
  50  |     await expect(drawerContent).toBeVisible()
  51  |     await expect(drawerContent.locator('.n-drawer-header__main')).toContainText('仓位明细')
  52  | 
  53  |     // 描述列表
  54  |     const descriptions = page.locator('.n-descriptions')
  55  |     await expect(descriptions).toBeVisible()
  56  |     await expect(descriptions).toContainText('快照日期')
  57  |     await expect(descriptions).toContainText('总资产')
  58  |     await expect(descriptions).toContainText('现金')
  59  |     await expect(descriptions).toContainText('持仓市值')
  60  | 
  61  |     // 明细表格 — wait for items to load async
  62  |     const detailTable = page.locator('.position-detail-drawer__table .n-data-table')
  63  |     await expect(detailTable.locator('tbody tr').first()).toBeVisible()
  64  |     await expect(detailTable.getByRole('columnheader', { name: '标的' })).toBeVisible()
  65  |     await expect(detailTable.getByRole('columnheader', { name: '仓位占比' })).toBeVisible()
  66  |   })
  67  | 
  68  |   // ── 4. 删除快照 ──────────────────────────────────────────────────────
  69  | 
  70  |   test('删除快照 — Popconfirm 确认后删除', async ({ page }) => {
  71  |     await page.getByRole('button', { name: '删除' }).first().click()
  72  |     await expect(page.getByText('确认删除该快照吗？此操作不可恢复。')).toBeVisible()
  73  |     await page.locator('.n-popconfirm .n-button--primary-type').click()
  74  |   })
  75  | 
  76  |   // ── 5. 生成快照抽屉 ──────────────────────────────────────────────────
  77  | 
  78  |   test('生成快照 — Drawer 打开并显示表单和持仓', async ({ page }) => {
  79  |     await page.getByRole('button', { name: '+ 生成快照' }).click()
  80  | 
  81  |     const drawerContent = page.locator('.n-drawer-content').last()
  82  |     await expect(drawerContent).toBeVisible()
  83  |     await expect(drawerContent.locator('.n-drawer-header__main')).toContainText('生成仓位快照')
  84  | 
  85  |     await expect(page.getByText('快照日期')).toBeVisible()
  86  |     await expect(page.getByPlaceholder('请输入总资产')).toBeVisible()
  87  |     await expect(page.getByPlaceholder('请输入现金')).toBeVisible()
  88  | 
  89  |     // 持仓区域
  90  |     await expect(page.locator('.holding-section')).toBeVisible()
  91  |     await expect(page.locator('.holding-table__header')).toContainText('标的')
  92  |     await expect(page.locator('.holding-table__header')).toContainText('当前价')
  93  |     await expect(page.locator('.holding-table__header')).toContainText('市值')
  94  | 
  95  |     await expect(page.getByRole('button', { name: '取消' })).toBeVisible()
  96  |     await expect(page.getByRole('button', { name: '生成快照', exact: true })).toBeVisible()
  97  |   })
  98  | 
  99  |   // ── 6. 仓位占比计算正确 ───────────────────────────────────────────
  100 | 
  101 |   test('仓位占比 — 持仓明细中占比计算正确', async ({ page }) => {
  102 |     await page.getByRole('button', { name: '查看明细' }).first().click()
  103 | 
  104 |     const detailTable = page.locator('.position-detail-drawer__table .n-data-table')
  105 |     await expect(detailTable.locator('tbody tr').first()).toBeVisible()
  106 | 
  107 |     const row = detailTable.locator('tbody tr').first()
  108 | 
  109 |     // mock: marketValue=750000, totalAssets=10000000
  110 |     // ratio = 750000 / 10000000 = 0.075 → 7.5%
  111 |     const ratioCell = row.locator('td').last()
  112 |     await expect(ratioCell).toContainText('7.5%')
  113 | 
  114 |     // 验证市值：marketValue=750000 fen → ¥7,500.00
  115 |     const marketValueCell = row.locator('td').nth(4)
  116 |     await expect(marketValueCell).toContainText('¥7,500.00')
  117 | 
  118 |     // 验证浮动盈亏：unrealizedPnl=150000 → +¥1,500.00
  119 |     const pnlCell = row.locator('td').nth(5)
  120 |     await expect(pnlCell).toContainText('+¥1,500.00')
  121 |   })
  122 | 
  123 |   // ── 7. 浮动盈亏颜色 — 通过文本符号验证 ─────────────────────────────
```