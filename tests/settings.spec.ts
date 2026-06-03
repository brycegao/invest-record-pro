import { test, expect, gotoAndWait } from './fixtures'

/**
 * Batch 10a · Settings + Ollama 服务验证
 *
 * 验证清单（对应 README-verification.md）：
 * 1. 在 Settings → AI 设置中点击 [测试连接] → 显示"已连接"
 * 2. Ollama 不可用时显示"未连接"
 * 3. 输入非 localhost / 127.0.0.1 / ::1 的 Ollama 地址时拒绝保存并提示错误
 * 4. Prompt 模板服务能正确组装 prompt 文本
 *
 * Mock 策略：
 * - Tauri commands（get_settings, upsert_setting）通过现有 Tauri mock
 * - Ollama fetch 调用通过 window.fetch mock（addInitScript 注入）
 */

// ---- fetch mock script for Ollama API ----

function createFetchMockScript(options: {
  tagsAvailable?: boolean
  tagsError?: boolean
  generateResponse?: string
}): string {
  const { tagsAvailable = true, tagsError = false, generateResponse = '' } = options

  const tagsHandler = tagsError
    ? `throw new Error('Connection refused')`
    : tagsAvailable
      ? `return new Response(JSON.stringify({ models: [{ name: 'qwen2.5:7b', model: 'qwen2.5:7b', modified_at: '2026-01-01', size: 4700000000 }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })`
      : `return new Response(JSON.stringify({ models: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })`

  return `
    (function() {
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        const urlStr = typeof url === 'string' ? url : url.url;

        // Ollama API calls
        if (urlStr.includes('/api/tags')) {
          ${tagsHandler}
        }

        if (urlStr.includes('/api/generate')) {
          return new Response(JSON.stringify({
            model: 'qwen2.5:7b',
            response: ${JSON.stringify(generateResponse)},
            done: true,
            total_duration: 5000000000,
            eval_count: 100
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Non-Ollama calls go through original fetch (for Vite HMR etc.)
        return originalFetch.apply(this, arguments);
      };
      console.log('[Fetch Mock] Injected');
    })();
  `
}

test.describe('Batch 10a · Settings + Ollama 服务', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/settings')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────

  test('页面加载 — 标题和 AI 设置卡片可见', async ({ page }) => {
    await expect(page.locator('.settings-page__title')).toHaveText('设置')

    // AI 设置卡片 — scope to .settings-page 避免匹配 MainLayout 的 n-card
    const aiCard = page.locator('.settings-page .n-card').filter({ hasText: 'AI 设置' })
    await expect(aiCard).toBeVisible()

    // Ollama 地址输入框
    await expect(aiCard.getByPlaceholder('http://localhost:11434')).toBeVisible()

    // 模型选择器
    await expect(aiCard.locator('.n-base-selection').first()).toBeVisible()

    // 测试连接按钮
    await expect(page.getByRole('button', { name: '测试连接' })).toBeVisible()
  })

  // ── 2. 测试连接成功 ──────────────────────────────────────────

  test('测试连接 — Ollama 可用时显示"已连接"标签', async ({ page }) => {
    await page.addInitScript(createFetchMockScript({ tagsAvailable: true }))
    await gotoAndWait(page, '/settings')

    // mock: get_settings 返回 ollama_url=http://localhost:11434, 已是 loopback
    // 点击测试连接
    await page.getByRole('button', { name: '测试连接' }).click()
    await page.waitForTimeout(500)

    // 应显示"✓ 已连接"文本（n-text 组件）
    await expect(page.getByText('✓ 已连接')).toBeVisible()
  })

  // ── 3. Ollama 不可用 ──────────────────────────────────────────

  test('测试连接 — Ollama 不可用时显示"未连接"标签', async ({ page }) => {
    await page.addInitScript(createFetchMockScript({ tagsError: true }))
    await gotoAndWait(page, '/settings')

    await page.getByRole('button', { name: '测试连接' }).click()
    await page.waitForTimeout(1000)

    await expect(page.getByText('✗ 未连接')).toBeVisible()
  })

  // ── 4. 非 localhost 地址拒绝 ──────────────────────────────────

  test('非 localhost 地址 — 拒绝连接并显示错误提示', async ({ page }) => {
    await page.addInitScript(createFetchMockScript({ tagsAvailable: true }))
    await gotoAndWait(page, '/settings')

    // 清除默认值，输入非本机地址
    const urlInput = page.locator('.n-card').filter({ hasText: 'AI 设置' }).getByPlaceholder('http://localhost:11434')
    await urlInput.click()
    await urlInput.fill('http://example.com:11434')

    // 点击测试连接（会在 setBaseUrl 时抛出错误）
    await page.getByRole('button', { name: '测试连接' }).click()
    await page.waitForTimeout(500)

    // 应显示错误提示（Naive UI message）
    await expect(page.getByText('仅允许本机地址')).toBeVisible()
  })

  // ── 5. Prompt 模板服务 — 正确组装 prompt 文本 ──────────────

  test('Prompt 模板 — buildMonthlyReviewPrompt 正确组装', async ({ page }) => {
    // 通过 page.evaluate 在浏览器中直接调用 service 函数
    const result = await page.evaluate(async () => {
      // 动态导入 service 模块
      const module = await import('/src/services/prompt-template.service.ts')
      const { buildMonthlyReviewPrompt, PROMPT_VERSION } = module

      const promptResult = buildMonthlyReviewPrompt({
        month: '2026-05',
        tradeCount: 3,
        buyCount: 2,
        sellCount: 1,
        totalBuyAmount: 500000,
        totalSellAmount: 200000,
        realizedPnl: 50000,
        planExecutionRate: 7500,
        moodDistribution: { calm: 2, anxious: 1 },
        recentTrades: [
          { code: '510300', type: '买入', amount: 300000, mood: 'calm' },
        ],
        recentPlans: [
          { code: '510300', type: 'buy', status: 'pending' },
        ],
      })

      return {
        version: PROMPT_VERSION,
        systemContains: promptResult.system.includes('2026-05'),
        systemHasBoundary: promptResult.system.includes('不提供买入'),
        promptContainsMonth: promptResult.prompt.includes('2026-05'),
        promptContainsStats: promptResult.prompt.includes('3'),
        promptContainsBuyCount: promptResult.prompt.includes('2'),
        promptContainsMood: promptResult.prompt.includes('平静'),
        promptContainsTrade: promptResult.prompt.includes('510300'),
        promptContainsPlan: promptResult.prompt.includes('买入计划'),
        system: promptResult.system,
        prompt: promptResult.prompt,
      }
    })

    // 验证 prompt 版本
    expect(result.version).toBe('v1')

    // 验证 system prompt
    expect(result.systemContains).toBeTruthy()
    expect(result.systemHasBoundary).toBeTruthy()

    // 验证 user prompt 包含关键数据
    expect(result.promptContainsMonth).toBeTruthy()
    expect(result.promptContainsStats).toBeTruthy()
    expect(result.promptContainsBuyCount).toBeTruthy()
    expect(result.promptContainsMood).toBeTruthy()
    expect(result.promptContainsTrade).toBeTruthy()
    expect(result.promptContainsPlan).toBeTruthy()
  })
})
