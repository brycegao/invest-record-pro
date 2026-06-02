# Playwright E2E 自动化测试方案

> 本方案基于 Tauri Mock + Vite Dev Server，无需 `cargo tauri dev`，纯前端运行。
> 适用于所有批次的 UI 自动化验证，后续新增模块时按此模板编写测试。

---

## 架构概览

```
tests/
├── fixtures.ts              # 扩展 test fixture：Tauri Mock 注入 + gotoAndWait
├── tauri-mock.ts            # Mock 数据 + Mock Store + createTauriMockScript()
├── home.spec.ts             # 冒烟测试（侧边栏、路由、Mock 注入）
├── positions.spec.ts       # Batch 06 · Positions 仓位快照
├── reviews.spec.ts          # Batch 07 · Reviews 交易复盘
└── market-observations.spec.ts  # Batch 08 · Market Observations 市场观察
```

**核心机制**：
1. `playwright.config.ts` 配置 `webServer.command: 'npm run dev'`，自动启动 Vite 开发服务器
2. `test.beforeEach` 通过 `page.addInitScript()` 注入 Tauri Mock（覆盖 `window.__TAURI_INTERNALS__`）
3. Mock 数据在 `tauri-mock.ts` 中定义，每个 Tauri 命令映射到对应的 Mock 返回值
4. 运行时可通过 `mockCommand` fixture 动态覆盖单个命令的返回值

---

## 快速使用

### 运行全部测试

```bash
npx playwright test
```

### 运行指定模块

```bash
npx playwright test tests/positions.spec.ts
npx playwright test tests/reviews.spec.ts
npx playwright test tests/market-observations.spec.ts
```

### 查看 HTML 报告

```bash
npx playwright test --reporter=html
open test-results/index.html
```

### 调试单个测试

```bash
npx playwright test --debug tests/positions.spec.ts -g "仓位占比"
```

---

## 编写新测试模板

### 1. 在 `tauri-mock.ts` 添加 Mock 数据

```typescript
// Mock 数据（TypeScript 类型安全）
export const mockNewModule = [
  {
    id: 1,
    // ... 字段与 Domain 类型一致
  },
]

// 在 defaultMockStore 中注册命令
export const defaultMockStore: Record<string, unknown> = {
  // ... 已有命令
  get_new_module: mockNewModule,
  create_new_module: mockNewModule[0],
  // ...
}
```

### 2. 创建测试文件 `tests/new-module.spec.ts`

```typescript
import { test, expect, gotoAndWait } from './fixtures'

test.describe('Batch XX · NewModule 模块名', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/new-module')
  })

  // ── 1. 页面加载 ──────────────────────────────────────────────

  test('页面加载 — 标题和表格可见', async ({ page }) => {
    // BEM 命名定位页面级元素
    await expect(page.locator('.new-module-page__title')).toHaveText('模块标题')

    // 表格列头验证
    const table = page.locator('.n-data-table')
    const headers = ['列1', '列2', '操作']
    for (const h of headers) {
      await expect(table.getByRole('columnheader', { name: h })).toBeVisible()
    }

    // 等待数据加载
    await expect(table.locator('tbody tr').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '+ 新增' })).toBeVisible()
  })

  // ── 2. 新增抽屉 ──────────────────────────────────────────────

  test('新增 — Drawer 打开并显示表单', async ({ page }) => {
    await page.getByRole('button', { name: '+ 新增' }).click()

    // Naive UI NDrawer 定位方式
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('新增标题')

    // 表单字段验证
    await expect(dialog.getByPlaceholder('输入提示')).toBeVisible()

    // 关闭
    await dialog.getByRole('button', { name: '取消' }).click()
    await page.waitForTimeout(300)
    await expect(dialog).not.toBeVisible()
  })

  // ── 3. 数据渲染 ──────────────────────────────────────────────

  test('数据渲染 — 格式化和 tag 正确', async ({ page }) => {
    const row = page.locator('.n-data-table tbody tr').first()

    // 文本验证
    await expect(row.locator('td').nth(0)).toContainText('期望文本')

    // NTag 验证（如有）
    const tag = row.locator('td').nth(1).locator('.n-tag')
    await expect(tag).toContainText('标签文本')
    await expect(tag).toBeVisible()

    // Null 字段显示 "—"
    await expect(row.locator('td').nth(2)).toContainText('—')
  })

  // ── 4. 筛选功能 ──────────────────────────────────────────────

  test('筛选栏 — 输入框和按钮可交互', async ({ page }) => {
    await expect(page.getByPlaceholder('搜索提示')).toBeVisible()
    await expect(page.locator('.new-module-page__filter .n-select')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜索' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '重置' })).toBeEnabled()
  })

  // ── 5. 交互操作 ──────────────────────────────────────────────

  test('删除 — Popconfirm 确认后删除', async ({ page }) => {
    await page.getByRole('button', { name: '删除' }).first().click()
    await expect(page.getByText('确认删除')).toBeVisible()
    await page.locator('.n-popconfirm .n-button--primary-type').click()
  })
})
```

---

## Naive UI 组件定位要点

| 组件 | 定位方式 | 注意事项 |
|------|---------|---------|
| NDataTable | `.n-data-table` | tbody tr 通过 `nth(index)` 定位列 |
| NDrawer | `page.getByRole('dialog')` 或 `.n-drawer-header__main` | Dialog 是 portal 渲染，**不在** `.n-drawer` 内部 |
| NStatistic | `.n-statistic` + `filter({ hasText: '标签' })` | value-style 在 `.n-statistic-value__content` |
| NTag | `.n-tag` | 类型判断用 `toHaveClass(/n-tag--success/)` |
| NSelect | `.n-base-selection` 触发，`.n-base-select-option` 定位选项 | 选项是 **portal 渲染**，用 `page.locator()` |
| NSelect placeholder | `getByText('placeholder文本')` | **不是** `getByPlaceholder`，Naive UI 用普通文本渲染 |
| NPopconfirm | `.n-popconfirm .n-button--primary-type` | 确认按钮用 primary-type 类 |
| NDatePicker | `.n-date-picker` | Naive UI 自定义输入组件 |
| NInputNumber | `getByPlaceholder('提示')` | 与 NInput 用法相同 |
| NRadioGroup | `.n-radio-group` + `.n-radio` | 选中判断用 `.n-radio--checked` |
| NSpace | `.n-space` | 按钮组容器 |

---

## Mock 数据覆盖（运行时）

```typescript
test('自定义 Mock 数据测试', async ({ page, mockCommand }) => {
  // 运行时覆盖指定命令的返回值
  await mockCommand('get_positions', [])

  await gotoAndWait(page, '/positions')
  await expect(page.locator('.n-data-table tbody tr')).toHaveCount(0)
})
```

---

## 金融工具函数验证参考

| 函数 | 存储单位 | 显示格式 | 示例 |
|------|---------|---------|------|
| `fenToYuan(fen)` | 分 → 元 | 除以 100 | 1200 → 12.00 |
| `yuanToFen(yuan)` | 元 → 分 | 乘以 100 取整 | 12.5 → 1250 |
| `displayQuantity(stored)` | ×1000 | 除以 1000 | 5000 → 5 |
| `formatMoney(fen)` | 分 | `¥千分位.2位` | 100000 → ¥1,000.00 |
| `formatSignedMoney(fen)` | 分 | `+/-` + formatMoney | 5000 → +¥50.00 |
| `formatIndexPoint(stored)` | ×100 | 除以 100 + 千分位 | 318000 → 3,180.00 |
| `formatQuantity(stored)` | ×1000 | 除以 1000 + 千分位 | 5000 → 5 |

---

## 常见问题

### Vite HMR 冷启动导致 flaky
第一个 page load test 有时因 Vite HMR 未就绪而超时（6.9s），retry 后通过（~2.0s）。这是 Vite dev server 的正常行为，**不影响测试正确性**。生产构建不会出现此问题。

### NDrawer dialog 定位失败
Naive UI NDrawer 将内容渲染为 portal `<dialog>` 元素，**不在** `.n-drawer` DOM 节点内。正确做法：
```typescript
// ✅ 正确
const dialog = page.getByRole('dialog')
const drawerHeader = page.locator('.n-drawer-header__main').filter({ hasText: '标题' })

// ❌ 错误
drawer.getByRole('dialog')  // dialog 不在 .n-drawer 内部
```

### NSelect placeholder 无法用 getByPlaceholder
Naive UI NSelect 将 placeholder 渲染为普通 `<span>` 文本节点，而非 input 的 placeholder 属性：
```typescript
// ✅ 正确
await expect(dialog.getByText('选择市场情绪（可选）')).toBeVisible()

// ❌ 错误
await expect(dialog.getByPlaceholder('选择市场情绪（可选）')).toBeVisible()
```

### NSelect 下拉选项定位
选项通过 portal 渲染到 body，需要用 page 级别定位：
```typescript
await page.locator('.n-base-selection').first().click()
await page.locator('.n-base-select-option').filter({ hasText: '选项文本' }).first().click()
```

### getByText 匹配多个元素
当页面中存在同名文本（如表格列头 + 抽屉表单标签），用 dialog scope 避免：
```typescript
// ✅ 正确 — scope 到 dialog
await expect(page.getByRole('dialog').getByText('观察时间')).toBeVisible()

// ❌ 错误 — 匹配表格列头和表单标签
await expect(page.getByText('观察时间')).toBeVisible()
```
