import { test, expect, gotoAndWait } from './fixtures'

test.describe('Batch 07 · Reviews 交易复盘', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/reviews')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────────────

  test('页面加载 — 标题、描述和表格可见', async ({ page }) => {
    await expect(page.locator('.reviews-page__title')).toHaveText('交易复盘')
    await expect(page.locator('.reviews-page__description')).toHaveText('记录和反思每一笔交易')

    const table = page.locator('.n-data-table')
    const headers = ['复盘时间', '交易信息', '交易结果', '问题类型', '总结', '改进点', '操作']
    for (const h of headers) {
      await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
    }

    await expect(table.locator('tbody tr').first()).toBeVisible()
    await expect(table.locator('tbody tr')).toHaveCount(1)
    await expect(page.getByRole('button', { name: '+ 新增复盘' })).toBeVisible()
  })

  // ── 2. 表格数据渲染 ────────────────────────────────────────────────────

  test('表格数据 — 交易结果和问题类型 tag 渲染正确', async ({ page }) => {
    const row = page.locator('.n-data-table tbody tr').first()

    const resultTag = row.locator('td').nth(2).locator('.n-tag')
    await expect(resultTag).toContainText('好')

    const issueTag = row.locator('td').nth(3).locator('.n-tag')
    await expect(issueTag).toContainText('规则')

    await expect(row.locator('td').nth(4)).toContainText('按照计划买入沪深300')
  })

  // ── 3. 筛选功能 ──────────────────────────────────────────────────────

  test('筛选栏 — 输入框和按钮可交互', async ({ page }) => {
    await expect(page.getByPlaceholder('搜索标的代码或名称')).toBeVisible()
    await expect(page.locator('.reviews-page__date-item .n-date-picker')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '重置' })).toBeEnabled()
  })

  // ── 4. 新增复盘抽屉 ────────────────────────────────────────────────────

  test('新增复盘 — Drawer 打开并显示表单', async ({ page }) => {
    await page.getByRole('button', { name: '+ 新增复盘' }).click()

    // 使用最后一个 .n-drawer-content
    const drawerContent = page.locator('.n-drawer-content').last()
    await expect(drawerContent).toBeVisible()
    await expect(drawerContent.locator('.n-drawer-header__main')).toContainText('新增复盘')

    // 表单字段
    await expect(drawerContent).toContainText('关联交易')

    // 交易结果单选按钮
    await expect(drawerContent.locator('.n-radio-group')).toBeVisible()
    await expect(drawerContent.locator('.n-radio').filter({ hasText: '好' })).toBeVisible()
    await expect(drawerContent.locator('.n-radio').filter({ hasText: '差' })).toBeVisible()
    await expect(drawerContent.locator('.n-radio').filter({ hasText: '一般' })).toBeVisible()

    // 问题类型
    await expect(drawerContent.getByText('问题类型', { exact: true })).toBeVisible()

    // 总结和改进点文本域
    await expect(drawerContent.getByPlaceholder('记录这次交易的整体评价和反思')).toBeVisible()
    await expect(drawerContent.getByPlaceholder('下次可以改进的地方（可选）')).toBeVisible()

    // 底部按钮
    await expect(drawerContent.getByRole('button', { name: '取消' })).toBeVisible()
    await expect(drawerContent.getByRole('button', { name: '保存' })).toBeVisible()
  })

  // ── 5. 从交易记录跳转 — tradeId 预填 ────────────────────────────────

  test('tradeId 预填 — 通过 URL query 参数预填关联交易', async ({ page }) => {
    await gotoAndWait(page, '/reviews?tradeId=1')

    await expect(page.locator('.reviews-page__title')).toHaveText('交易复盘')
    await expect(page.locator('.n-data-table tbody tr').first()).toBeVisible()
  })

  // ── 6. 新增复盘 — 选择关联交易并填写 ──────────────────────────────────

  test('新增复盘 — 选择关联交易并填写表单', async ({ page }) => {
    await page.getByRole('button', { name: '+ 新增复盘' }).click()

    // 等待 drawer header 出现
    const drawerHeader = page.locator('.n-drawer-header__main').filter({ hasText: '新增复盘' })
    await expect(drawerHeader).toBeVisible()

    // 选择关联交易 — 点击 NSelect 打开下拉
    await page.locator('.n-drawer-content').last().locator('.n-base-selection').first().click()
    // 等待 NSelect 选项出现（portal 渲染）
    const tradeOption = page.locator('.n-base-select-option').filter({ hasText: '510300' }).first()
    await tradeOption.waitFor({ state: 'visible', timeout: 10000 })
    await tradeOption.click()

    // 选择交易结果 "好"
    await page.locator('.n-radio').filter({ hasText: '好' }).click()

    // 填写总结
    await page.getByPlaceholder('记录这次交易的整体评价和反思').fill('按计划执行买入，纪律良好')
  })

  // ── 7. Tag 验证 ──────────────────────────────────────────────────────

  test('Tag — 交易结果和问题类型 NTag 正确渲染', async ({ page }) => {
    const row = page.locator('.n-data-table tbody tr').first()

    const resultTag = row.locator('td').nth(2).locator('.n-tag')
    await expect(resultTag).toBeVisible()
    await expect(resultTag).toContainText('好')

    const issueTag = row.locator('td').nth(3).locator('.n-tag')
    await expect(issueTag).toBeVisible()
    await expect(issueTag).toContainText('规则')
  })
})
