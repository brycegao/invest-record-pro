/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 帮助页面 E2E 测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { test, expect, gotoAndWait } from './fixtures'

test.describe('帮助页面', () => {
  test('页面加载成功，标题和说明可见', async ({ page }) => {
    await gotoAndWait(page, '/help')

    await expect(page.locator('.help-page__title')).toHaveText('帮助')
    await expect(page.locator('.help-page__description')).toBeVisible()
  })

  test('Ollama 配置指南内容完整', async ({ page }) => {
    await gotoAndWait(page, '/help')

    // 验证四个步骤的标题
    const sectionTitles = page.locator('.help-page__section-title')
    await expect(sectionTitles.filter({ hasText: '安装 Ollama' })).toBeVisible()
    await expect(sectionTitles.filter({ hasText: '启动 Ollama 服务' })).toBeVisible()
    await expect(sectionTitles.filter({ hasText: '下载大语言模型' })).toBeVisible()
    await expect(sectionTitles.filter({ hasText: '在软件中配置' })).toBeVisible()

    // 验证关键内容
    await expect(page.locator('.help-page')).toContainText('ollama.com')
    await expect(page.locator('.help-page')).toContainText('qwen2.5:7b')
    await expect(page.locator('.help-page')).toContainText('http://localhost:11434')
    await expect(page.locator('.help-page')).toContainText('ollama pull qwen2.5:7b')
    await expect(page.locator('.help-page')).toContainText('常见问题')
  })

  test('功能说明列表完整', async ({ page }) => {
    await gotoAndWait(page, '/help')

    const funcNames = page.locator('.help-page__func-name')
    await expect(funcNames.filter({ hasText: '仪表盘' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '投资标的' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '交易计划' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '交易记录' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '仓位快照' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '交易复盘' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '市场观察' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '月度报告' })).toBeVisible()
    await expect(funcNames.filter({ hasText: '设置' })).toBeVisible()
  })
})
