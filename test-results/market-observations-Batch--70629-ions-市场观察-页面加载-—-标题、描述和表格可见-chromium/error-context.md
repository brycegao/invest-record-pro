# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: market-observations.spec.ts >> Batch 08 · Market Observations 市场观察 >> 页面加载 — 标题、描述和表格可见
- Location: tests/market-observations.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.n-data-table').locator('tbody tr').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.n-data-table').locator('tbody tr').first()

```

```yaml
- text: IR Invest Record Pro
- switch
- button "备份"
- button "关于"
- complementary:
  - menu:
    - menuitem "仪表盘"
    - menuitem "投资标的"
    - menuitem "交易计划"
    - menuitem "交易记录"
    - menuitem "仓位快照"
    - menuitem "交易复盘"
    - menuitem "市场观察"
    - menuitem "月度报告"
    - menuitem "设置"
- heading "市场观察" [level=2]
- paragraph: 记录市场环境和你的判断
- button "+ 新增观察"
- text: 日期范围
- textbox "开始日期"
- text: 开始日期
- img
- textbox "结束日期"
- text: 结束日期
- img
- text: 市场情绪 全部
- img "loading":
  - img
- button "搜索"
- button "重置"
- table:
  - rowgroup:
    - row "观察时间 上证指数 上证50 沪深300 成交额 市场情绪 政策事件 宏观备注 个人观点 操作":
      - columnheader "观察时间"
      - columnheader "上证指数"
      - columnheader "上证50"
      - columnheader "沪深300"
      - columnheader "成交额"
      - columnheader "市场情绪"
      - columnheader "政策事件"
      - columnheader "宏观备注"
      - columnheader "个人观点"
      - columnheader "操作"
- img
- text: 无数据
- img
- text: "1"
- img
```

# Test source

```ts
  1   | import { test, expect, gotoAndWait } from './fixtures'
  2   | 
  3   | test.describe('Batch 08 · Market Observations 市场观察', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await gotoAndWait(page, '/market-observations')
  6   |   })
  7   | 
  8   |   // ── 1. 页面加载 ──────────────────────────────────────────────────────
  9   | 
  10  |   test('页面加载 — 标题、描述和表格可见', async ({ page }) => {
  11  |     await expect(page.locator('.market-observations-page__title')).toHaveText('市场观察')
  12  |     await expect(page.locator('.market-observations-page__description')).toHaveText(
  13  |       '记录市场环境和你的判断',
  14  |     )
  15  | 
  16  |     const table = page.locator('.n-data-table')
  17  |     const headers = [
  18  |       '观察时间',
  19  |       '上证指数',
  20  |       '上证50',
  21  |       '沪深300',
  22  |       '成交额',
  23  |       '市场情绪',
  24  |       '政策事件',
  25  |       '宏观备注',
  26  |       '个人观点',
  27  |       '操作',
  28  |     ]
  29  |     for (const h of headers) {
  30  |       await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
  31  |     }
  32  | 
> 33  |     await expect(table.locator('tbody tr').first()).toBeVisible()
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  34  |     await expect(table.locator('tbody tr')).toHaveCount(2)
  35  |     await expect(page.getByRole('button', { name: '+ 新增观察' })).toBeVisible()
  36  |   })
  37  | 
  38  |   // ── 2. 情绪 tag 文本 ────────────────────────────────────────────────
  39  | 
  40  |   test('情绪 tag — 中和低情绪标签可见', async ({ page }) => {
  41  |     const rows = page.locator('.n-data-table tbody tr')
  42  | 
  43  |     const row1Tag = rows.nth(0).locator('td').nth(5).locator('.n-tag')
  44  |     await expect(row1Tag).toContainText('中')
  45  | 
  46  |     const row2Tag = rows.nth(1).locator('td').nth(5).locator('.n-tag')
  47  |     await expect(row2Tag).toContainText('低')
  48  |   })
  49  | 
  50  |   // ── 3. 指数和金额格式化 ──────────────────────────────────────────────
  51  | 
  52  |   test('格式化 — 指数千分位 + 金额带 ¥ 符号', async ({ page }) => {
  53  |     const row1 = page.locator('.n-data-table tbody tr').first()
  54  | 
  55  |     await expect(row1.locator('td').nth(1)).toContainText('3,180.00')
  56  |     await expect(row1.locator('td').nth(3)).toContainText('3,680.00')
  57  |     await expect(row1.locator('td').nth(4)).toContainText('¥85,000,000.00')
  58  | 
  59  |     const row2 = page.locator('.n-data-table tbody tr').nth(1)
  60  |     await expect(row2.locator('td').nth(6)).toContainText('—')
  61  |     await expect(row2.locator('td').nth(7)).toContainText('—')
  62  |   })
  63  | 
  64  |   // ── 4. 筛选功能 ──────────────────────────────────────────────────────
  65  | 
  66  |   test('筛选栏 — 日期范围、情绪选择和按钮可交互', async ({ page }) => {
  67  |     await expect(page.locator('.market-observations-page__date-item .n-date-picker')).toBeVisible()
  68  |     await expect(page.locator('.market-observations-page__select-item .n-select')).toBeVisible()
  69  |     await expect(page.getByRole('button', { name: '搜索' })).toBeEnabled()
  70  |     await expect(page.getByRole('button', { name: '重置' })).toBeEnabled()
  71  |   })
  72  | 
  73  |   // ── 5. 新增观察抽屉 ──────────────────────────────────────────────────
  74  | 
  75  |   test('新增观察 — Drawer 打开并显示表单', async ({ page }) => {
  76  |     await page.getByRole('button', { name: '+ 新增观察' }).click()
  77  | 
  78  |     // 等待 drawer 出现
  79  |     const drawerHeader = page.locator('.n-drawer-header__main').filter({ hasText: '新增观察' })
  80  |     await expect(drawerHeader).toBeVisible()
  81  | 
  82  |     // Naive UI NDrawer 渲染 dialog role，用其 scope 表单字段避免匹配表格列头
  83  |     const dialog = page.getByRole('dialog')
  84  | 
  85  |     // 验证表单字段存在
  86  |     await expect(dialog.getByText('观察时间')).toBeVisible()
  87  |     await expect(dialog.getByText('上证指数')).toBeVisible()
  88  |     await expect(dialog.getByText('沪深300')).toBeVisible()
  89  |     await expect(dialog.getByText('市场成交额')).toBeVisible()
  90  |     await expect(dialog.getByText('政策事件')).toBeVisible()
  91  |     await expect(dialog.getByText('个人观点')).toBeVisible()
  92  | 
  93  |     // 输入组件
  94  |     await expect(dialog.getByPlaceholder('选择观察时间')).toBeVisible()
  95  |     // NSelect placeholder 渲染为普通文本
  96  |     await expect(dialog.getByText('选择市场情绪（可选）')).toBeVisible()
  97  |     await expect(dialog.getByPlaceholder('政策、监管、行业事件')).toBeVisible()
  98  |     await expect(dialog.getByPlaceholder('你对市场的判断')).toBeVisible()
  99  | 
  100 |     // 后缀标签
  101 |     const suffixes = dialog.locator('.observation-form__suffix')
  102 |     await expect(suffixes.filter({ hasText: '点' })).toHaveCount(3)
  103 |     await expect(suffixes.filter({ hasText: '元' })).toHaveCount(1)
  104 | 
  105 |     // 底部按钮
  106 |     await expect(dialog.getByRole('button', { name: '取消' })).toBeVisible()
  107 |     await expect(dialog.getByRole('button', { name: '保存' })).toBeVisible()
  108 |   })
  109 | 
  110 |   // ── 6. 情绪 tag 存在验证 ────────────────────────────────────────────
  111 | 
  112 |   test('情绪 tag — 中和低标签的 NTag 存在', async ({ page }) => {
  113 |     const rows = page.locator('.n-data-table tbody tr')
  114 | 
  115 |     const row1Tag = rows.nth(0).locator('td').nth(5).locator('.n-tag')
  116 |     await expect(row1Tag).toBeVisible()
  117 |     await expect(row1Tag).toContainText('中')
  118 | 
  119 |     const row2Tag = rows.nth(1).locator('td').nth(5).locator('.n-tag')
  120 |     await expect(row2Tag).toBeVisible()
  121 |     await expect(row2Tag).toContainText('低')
  122 |   })
  123 | 
  124 |   // ── 7. 第 2 行指数数据格式化验证 ────────────────────────────────────
  125 | 
  126 |   test('第 2 行数据 — 所有指数和成交额格式化正确', async ({ page }) => {
  127 |     const row2 = page.locator('.n-data-table tbody tr').nth(1)
  128 | 
  129 |     await expect(row2.locator('td').nth(1)).toContainText('3,100.00')
  130 |     await expect(row2.locator('td').nth(2)).toContainText('2,780.00')
  131 |     await expect(row2.locator('td').nth(3)).toContainText('3,550.00')
  132 |     await expect(row2.locator('td').nth(4)).toContainText('¥72,000,000.00')
  133 |   })
```