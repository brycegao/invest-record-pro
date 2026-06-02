# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reviews.spec.ts >> Batch 07 · Reviews 交易复盘 >> 页面加载 — 标题、描述和表格可见
- Location: tests/reviews.spec.ts:10:3

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
- heading "交易复盘" [level=2]
- paragraph: 记录和反思每一笔交易
- button "+ 新增复盘"
- text: 标的搜索
- textbox "搜索标的代码或名称"
- text: 搜索标的代码或名称 交易日期
- textbox "开始日期"
- text: 开始日期
- img
- textbox "结束日期"
- text: 结束日期
- img
- text: 结果 全部
- img "loading":
  - img
- text: 问题类型 全部
- img "loading":
  - img
- button "搜索"
- button "重置"
- table:
  - rowgroup:
    - row "复盘时间 交易信息 交易结果 问题类型 总结 改进点 操作":
      - columnheader "复盘时间"
      - columnheader "交易信息"
      - columnheader "交易结果"
      - columnheader "问题类型"
      - columnheader "总结"
      - columnheader "改进点"
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
  3   | test.describe('Batch 07 · Reviews 交易复盘', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await gotoAndWait(page, '/reviews')
  6   |   })
  7   | 
  8   |   // ── 1. 页面加载 ──────────────────────────────────────────────────────
  9   | 
  10  |   test('页面加载 — 标题、描述和表格可见', async ({ page }) => {
  11  |     await expect(page.locator('.reviews-page__title')).toHaveText('交易复盘')
  12  |     await expect(page.locator('.reviews-page__description')).toHaveText('记录和反思每一笔交易')
  13  | 
  14  |     const table = page.locator('.n-data-table')
  15  |     const headers = ['复盘时间', '交易信息', '交易结果', '问题类型', '总结', '改进点', '操作']
  16  |     for (const h of headers) {
  17  |       await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
  18  |     }
  19  | 
> 20  |     await expect(table.locator('tbody tr').first()).toBeVisible()
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  21  |     await expect(table.locator('tbody tr')).toHaveCount(1)
  22  |     await expect(page.getByRole('button', { name: '+ 新增复盘' })).toBeVisible()
  23  |   })
  24  | 
  25  |   // ── 2. 表格数据渲染 ────────────────────────────────────────────────────
  26  | 
  27  |   test('表格数据 — 交易结果和问题类型 tag 渲染正确', async ({ page }) => {
  28  |     const row = page.locator('.n-data-table tbody tr').first()
  29  | 
  30  |     const resultTag = row.locator('td').nth(2).locator('.n-tag')
  31  |     await expect(resultTag).toContainText('好')
  32  | 
  33  |     const issueTag = row.locator('td').nth(3).locator('.n-tag')
  34  |     await expect(issueTag).toContainText('规则')
  35  | 
  36  |     await expect(row.locator('td').nth(4)).toContainText('按照计划买入沪深300')
  37  |   })
  38  | 
  39  |   // ── 3. 筛选功能 ──────────────────────────────────────────────────────
  40  | 
  41  |   test('筛选栏 — 输入框和按钮可交互', async ({ page }) => {
  42  |     await expect(page.getByPlaceholder('搜索标的代码或名称')).toBeVisible()
  43  |     await expect(page.locator('.reviews-page__date-item .n-date-picker')).toBeVisible()
  44  |     await expect(page.getByRole('button', { name: '搜索' })).toBeEnabled()
  45  |     await expect(page.getByRole('button', { name: '重置' })).toBeEnabled()
  46  |   })
  47  | 
  48  |   // ── 4. 新增复盘抽屉 ────────────────────────────────────────────────────
  49  | 
  50  |   test('新增复盘 — Drawer 打开并显示表单', async ({ page }) => {
  51  |     await page.getByRole('button', { name: '+ 新增复盘' }).click()
  52  | 
  53  |     // 使用最后一个 .n-drawer-content
  54  |     const drawerContent = page.locator('.n-drawer-content').last()
  55  |     await expect(drawerContent).toBeVisible()
  56  |     await expect(drawerContent.locator('.n-drawer-header__main')).toContainText('新增复盘')
  57  | 
  58  |     // 表单字段
  59  |     await expect(drawerContent).toContainText('关联交易')
  60  | 
  61  |     // 交易结果单选按钮
  62  |     await expect(drawerContent.locator('.n-radio-group')).toBeVisible()
  63  |     await expect(drawerContent.locator('.n-radio').filter({ hasText: '好' })).toBeVisible()
  64  |     await expect(drawerContent.locator('.n-radio').filter({ hasText: '差' })).toBeVisible()
  65  |     await expect(drawerContent.locator('.n-radio').filter({ hasText: '一般' })).toBeVisible()
  66  | 
  67  |     // 问题类型
  68  |     await expect(drawerContent.getByText('问题类型', { exact: true })).toBeVisible()
  69  | 
  70  |     // 总结和改进点文本域
  71  |     await expect(drawerContent.getByPlaceholder('记录这次交易的整体评价和反思')).toBeVisible()
  72  |     await expect(drawerContent.getByPlaceholder('下次可以改进的地方（可选）')).toBeVisible()
  73  | 
  74  |     // 底部按钮
  75  |     await expect(drawerContent.getByRole('button', { name: '取消' })).toBeVisible()
  76  |     await expect(drawerContent.getByRole('button', { name: '保存' })).toBeVisible()
  77  |   })
  78  | 
  79  |   // ── 5. 从交易记录跳转 — tradeId 预填 ────────────────────────────────
  80  | 
  81  |   test('tradeId 预填 — 通过 URL query 参数预填关联交易', async ({ page }) => {
  82  |     await gotoAndWait(page, '/reviews?tradeId=1')
  83  | 
  84  |     await expect(page.locator('.reviews-page__title')).toHaveText('交易复盘')
  85  |     await expect(page.locator('.n-data-table tbody tr').first()).toBeVisible()
  86  |   })
  87  | 
  88  |   // ── 6. 新增复盘 — 选择关联交易并填写 ──────────────────────────────────
  89  | 
  90  |   test('新增复盘 — 选择关联交易并填写表单', async ({ page }) => {
  91  |     await page.getByRole('button', { name: '+ 新增复盘' }).click()
  92  | 
  93  |     // 等待 drawer header 出现
  94  |     const drawerHeader = page.locator('.n-drawer-header__main').filter({ hasText: '新增复盘' })
  95  |     await expect(drawerHeader).toBeVisible()
  96  | 
  97  |     // 选择关联交易 — 点击 NSelect 打开下拉
  98  |     await page.locator('.n-drawer-content').last().locator('.n-base-selection').first().click()
  99  |     // 等待 NSelect 选项出现（portal 渲染）
  100 |     const tradeOption = page.locator('.n-base-select-option').filter({ hasText: '510300' }).first()
  101 |     await tradeOption.waitFor({ state: 'visible', timeout: 10000 })
  102 |     await tradeOption.click()
  103 | 
  104 |     // 选择交易结果 "好"
  105 |     await page.locator('.n-radio').filter({ hasText: '好' }).click()
  106 | 
  107 |     // 填写总结
  108 |     await page.getByPlaceholder('记录这次交易的整体评价和反思').fill('按计划执行买入，纪律良好')
  109 |   })
  110 | 
  111 |   // ── 7. Tag 验证 ──────────────────────────────────────────────────────
  112 | 
  113 |   test('Tag — 交易结果和问题类型 NTag 正确渲染', async ({ page }) => {
  114 |     const row = page.locator('.n-data-table tbody tr').first()
  115 | 
  116 |     const resultTag = row.locator('td').nth(2).locator('.n-tag')
  117 |     await expect(resultTag).toBeVisible()
  118 |     await expect(resultTag).toContainText('好')
  119 | 
  120 |     const issueTag = row.locator('td').nth(3).locator('.n-tag')
```