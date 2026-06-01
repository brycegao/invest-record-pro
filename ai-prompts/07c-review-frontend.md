# Batch 7c：Reviews 模块 — 前端全套

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义：Review, ReviewCreatePayload, ReviewFilter, REVIEW_RESULT_LABELS, ISSUE_TYPE_LABELS
- 已有模块作为代码风格参考

## 任务

生成 Reviews 模块的前端全套代码。

## 生成文件清单

### 1. `src/features/reviews/repository.ts`

```ts
export async function getReviews(): Promise<Review[]>
export async function createReview(payload: ReviewCreatePayload): Promise<Review>
export async function updateReview(payload: ReviewUpdatePayload): Promise<Review>
export async function deleteReview(id: number): Promise<void>
export async function queryReviews(filter: ReviewFilter): Promise<Review[]>
```

### 2. `src/features/reviews/store.ts`

useReviewStore（Setup Store 风格）

### 3. `src/features/reviews/components/ReviewTable.vue`

表格列：

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 复盘时间 | createdAt | left | 170 |
| 交易信息 | tradeAssetCode + tradeType + tradeCreatedAt | left | 200 |
| 交易结果 | result (tag) | center | 90 |
| 问题类型 | issueType (tag) | center | 90 |
| 总结 | summary（超 50 字截断） | left | flex |
| 改进点 | improve（超 50 字截断） | left | flex |
| 操作 | — | center | 100 |

**tag 配色**：
- result：good → `success`，bad → `error`，neutral → `warning`
- issueType：emotion → `warning`，rule → `info`，discipline → `error`，external → `default`

操作列：`[编辑]` `[删除]`

### 4. `src/features/reviews/components/ReviewForm.vue`

Drawer 表单，width=520px，标题："新增复盘" / "编辑复盘"

| 字段 | 组件 | 必填 | 备注 |
|------|------|------|------|
| tradeId | n-select | 是 | 远程搜索 trades，显示"标的-类型-时间"，选择后显示交易摘要 |
| result | n-radio-group | 是 | 好 / 差 / 一般 |
| issueType | n-select | 否 | emotion/rule/discipline/external |
| summary | n-input textarea rows=4 | 是 | |
| improve | n-input textarea rows=4 | 否 | |

**关联交易搜索**：调用 `queryTrades` 或单独的 trade 列表接口，格式化显示选项为 `"510050 买入 2026-05-30"`。

**路由跳转支持**：如果 URL 包含 `?tradeId=xxx`（从交易记录的"复盘"按钮跳转），自动预填 tradeId 并打开表单。

### 5. `src/pages/reviews/ReviewsPage.vue`

- 标题：交易复盘 / 记录和反思每一笔交易
- 操作按钮：`[+ 新增复盘]`
- 筛选区：标的搜索 + 交易日期(日期范围) + 结果 + 问题类型 + [搜索] [重置]
- 表格：ReviewTable
- 表单：ReviewForm

### 6. 模块导出文件

## 代码风格

- 参考 Assets 模块
- 禁止 any 类型
- `@/` 路径别名
