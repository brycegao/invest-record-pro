import { test, expect, gotoAndWait } from './fixtures'

test.describe('Batch 08 · Market Observations 市场观察', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/market-observations')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────────────

  test('页面加载 — 标题、描述和表格可见', async ({ page }) => {
    await expect(page.locator('.market-observations-page__title')).toHaveText('市场观察')
    await expect(page.locator('.market-observations-page__description')).toHaveText(
      '记录市场环境和你的判断',
    )

    const table = page.locator('.n-data-table')
    const headers = [
      '观察时间',
      '上证指数',
      '上证50',
      '沪深300',
      '成交额',
      '市场情绪',
      '政策事件',
      '宏观备注',
      '个人观点',
      '操作',
    ]
    for (const h of headers) {
      await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
    }

    await expect(table.locator('tbody tr').first()).toBeVisible()
    await expect(table.locator('tbody tr')).toHaveCount(2)
    await expect(page.getByRole('button', { name: '+ 新增观察' })).toBeVisible()
  })

  // ── 2. 情绪 tag 文本 ────────────────────────────────────────────────

  test('情绪 tag — 中和低情绪标签可见', async ({ page }) => {
    const rows = page.locator('.n-data-table tbody tr')

    const row1Tag = rows.nth(0).locator('td').nth(5).locator('.n-tag')
    await expect(row1Tag).toContainText('中')

    const row2Tag = rows.nth(1).locator('td').nth(5).locator('.n-tag')
    await expect(row2Tag).toContainText('低')
  })

  // ── 3. 指数和金额格式化 ──────────────────────────────────────────────

  test('格式化 — 指数千分位 + 金额带 ¥ 符号', async ({ page }) => {
    const row1 = page.locator('.n-data-table tbody tr').first()

    await expect(row1.locator('td').nth(1)).toContainText('3,180.00')
    await expect(row1.locator('td').nth(3)).toContainText('3,680.00')
    await expect(row1.locator('td').nth(4)).toContainText('¥85,000,000.00')

    const row2 = page.locator('.n-data-table tbody tr').nth(1)
    await expect(row2.locator('td').nth(6)).toContainText('—')
    await expect(row2.locator('td').nth(7)).toContainText('—')
  })

  // ── 4. 筛选功能 ──────────────────────────────────────────────────────

  test('筛选栏 — 日期范围、情绪选择和按钮可交互', async ({ page }) => {
    await expect(page.locator('.market-observations-page__date-item .n-date-picker')).toBeVisible()
    await expect(page.locator('.market-observations-page__select-item .n-select')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '重置' })).toBeEnabled()
  })

  // ── 5. 新增观察抽屉 ──────────────────────────────────────────────────

  test('新增观察 — Drawer 打开并显示表单', async ({ page }) => {
    await page.getByRole('button', { name: '+ 新增观察' }).click()

    // 等待 drawer 出现
    const drawerHeader = page.locator('.n-drawer-header__main').filter({ hasText: '新增观察' })
    await expect(drawerHeader).toBeVisible()

    // Naive UI NDrawer 渲染 dialog role，用其 scope 表单字段避免匹配表格列头
    const dialog = page.getByRole('dialog')

    // 验证表单字段存在
    await expect(dialog.getByText('观察时间')).toBeVisible()
    await expect(dialog.getByText('上证指数')).toBeVisible()
    await expect(dialog.getByText('沪深300')).toBeVisible()
    await expect(dialog.getByText('市场成交额')).toBeVisible()
    await expect(dialog.getByText('政策事件')).toBeVisible()
    await expect(dialog.getByText('个人观点')).toBeVisible()

    // 输入组件
    await expect(dialog.getByPlaceholder('选择观察时间')).toBeVisible()
    // NSelect placeholder 渲染为普通文本
    await expect(dialog.getByText('选择市场情绪（可选）')).toBeVisible()
    await expect(dialog.getByPlaceholder('政策、监管、行业事件')).toBeVisible()
    await expect(dialog.getByPlaceholder('你对市场的判断')).toBeVisible()

    // 后缀标签
    const suffixes = dialog.locator('.observation-form__suffix')
    await expect(suffixes.filter({ hasText: '点' })).toHaveCount(3)
    await expect(suffixes.filter({ hasText: '元' })).toHaveCount(1)

    // 底部按钮
    await expect(dialog.getByRole('button', { name: '取消' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '保存' })).toBeVisible()
  })

  // ── 6. 情绪 tag 存在验证 ────────────────────────────────────────────

  test('情绪 tag — 中和低标签的 NTag 存在', async ({ page }) => {
    const rows = page.locator('.n-data-table tbody tr')

    const row1Tag = rows.nth(0).locator('td').nth(5).locator('.n-tag')
    await expect(row1Tag).toBeVisible()
    await expect(row1Tag).toContainText('中')

    const row2Tag = rows.nth(1).locator('td').nth(5).locator('.n-tag')
    await expect(row2Tag).toBeVisible()
    await expect(row2Tag).toContainText('低')
  })

  // ── 7. 第 2 行指数数据格式化验证 ────────────────────────────────────

  test('第 2 行数据 — 所有指数和成交额格式化正确', async ({ page }) => {
    const row2 = page.locator('.n-data-table tbody tr').nth(1)

    await expect(row2.locator('td').nth(1)).toContainText('3,100.00')
    await expect(row2.locator('td').nth(2)).toContainText('2,780.00')
    await expect(row2.locator('td').nth(3)).toContainText('3,550.00')
    await expect(row2.locator('td').nth(4)).toContainText('¥72,000,000.00')
  })

  // ── 8. 个人观点列 ──────────────────────────────────────────────────

  test('个人观点 — 第 1 行有值，第 2 行也有值', async ({ page }) => {
    const rows = page.locator('.n-data-table tbody tr')

    await expect(rows.nth(0).locator('td').nth(8)).toContainText('看多信号')
    await expect(rows.nth(1).locator('td').nth(8)).toContainText('观望为主')
  })

  // ── 9. 新增观察 — 填写上证指数输入框 ────────────────────────────────

  test('新增观察 — 填写上证指数输入框', async ({ page }) => {
    await page.getByRole('button', { name: '+ 新增观察' }).click()

    const drawerContent = page.locator('.n-drawer-content').last()
    await expect(drawerContent).toBeVisible()

    // 填写上证指数 — 用 placeholder "点" 定位 NInputNumber
    const indexInput = drawerContent.getByPlaceholder('点').first()
    await indexInput.click()
    await indexInput.fill('3200')
  })
})
