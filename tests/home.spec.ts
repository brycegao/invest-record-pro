import { test, expect, gotoAndWait } from './fixtures'

test.describe('冒烟测试 — 应用基本可用', () => {
  test('首页加载成功，侧边栏导航可见', async ({ page }) => {
    await gotoAndWait(page, '/')

    // 应重定向到 /dashboard
    await expect(page).toHaveURL('/dashboard')

    // 侧边栏应显示所有导航项（限定在 NMenu 组件内，避免与页面标题冲突）
    const nav = page.getByRole('menu')
    for (const label of ['仪表盘', '投资标的', '交易计划', '交易记录', '仓位快照', '交易复盘', '市场观察', '月度报告', '设置']) {
      await expect(nav.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('Tauri mock 注入成功，无 console error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await gotoAndWait(page, '/dashboard')

    // 验证 mock 注入日志
    const mockLogs = []
    page.on('console', (msg) => {
      if (msg.text().includes('[Tauri Mock]')) mockLogs.push(msg.text())
    })
    await page.reload()
    expect(mockLogs.some((l) => l.includes('mock commands'))).toBeTruthy()

    // 不应有未捕获的错误（"Command not mocked" 是 warn 而非 error）
    expect(errors.filter((e) => !e.includes('Command not mocked'))).toHaveLength(0)
  })

  test('点击侧边栏可导航到各页面', async ({ page }) => {
    await gotoAndWait(page, '/dashboard')

    // 点击"投资标的"
    await page.getByRole('menu').getByText('投资标的', { exact: true }).click()
    await expect(page).toHaveURL('/assets')

    // 点击"交易复盘"
    await page.getByRole('menu').getByText('交易复盘', { exact: true }).click()
    await expect(page).toHaveURL('/reviews')
  })
})
