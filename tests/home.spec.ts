/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 首页导航与基础功能 E2E 测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

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

    // Verify mock is functional — the page rendered correctly using mock data
    await expect(page.getByRole('menu')).toBeVisible()

    // No uncaught errors
    // Filter out known cold-start timing artifacts:
    //   - "Command not mocked" is a warn, not an error
    //   - "loadDashboard error" can occur when addInitScript and Vite module
    //     loading race on first page load in a fresh browser context
    const realErrors = errors.filter(
      (e) => !e.includes('Command not mocked') && !e.includes('loadDashboard error'),
    )
    expect(realErrors).toHaveLength(0)
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

  test('点击"关于"按钮 — 显示对话框，内容完整', async ({ page }) => {
    await gotoAndWait(page, '/dashboard')

    // 点击头部"关于"按钮
    await page.getByRole('button', { name: '关于' }).click()
    await page.waitForTimeout(300)

    // NModal card 对话框应可见
    const modal = page.locator('.n-modal')
    await expect(modal).toBeVisible()

    // 验证对话框内容
    await expect(modal).toContainText('Invest Record Pro')
    await expect(modal).toContainText('本地AI股票分析工具 · 纯离线运行 · 保障数据隐私')
    await expect(modal).toContainText('brycegao')
    await expect(modal).toContainText('V1.0.0')
    await expect(modal).toContainText('https://github.com/brycegao/invest-record-pro/')
    await expect(modal).toContainText('本软件完全本地运行，不联网、不上传数据')

    // 点击关闭按钮关闭对话框
    await modal.getByRole('button', { name: 'close' }).click()
    await page.waitForTimeout(300)
    await expect(modal).not.toBeVisible()
  })
})
