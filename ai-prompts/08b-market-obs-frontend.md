# Batch 8b：Market Observations 模块 — 前端全套

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义：MarketObservation, MarketObservationCreatePayload, MarketObservationFilter, SENTIMENTS, SENTIMENT_LABELS
- 已有模块作为代码风格参考

## 任务

生成 Market Observations 模块的前端全套代码（简单独立 CRUD）。

## 生成文件清单

### 1. `src/features/market-observations/repository.ts`

```ts
export async function getMarketObservations(): Promise<MarketObservation[]>
export async function createMarketObservation(payload: MarketObservationCreatePayload): Promise<MarketObservation>
export async function updateMarketObservation(payload: MarketObservationUpdatePayload): Promise<MarketObservation>
export async function deleteMarketObservation(id: number): Promise<void>
export async function queryMarketObservations(filter: MarketObservationFilter): Promise<MarketObservation[]>
```

### 2. `src/features/market-observations/store.ts`

useMarketObservationsStore（Setup Store 风格）

### 3. `src/features/market-observations/components/MarketObservationTable.vue`

表格列：

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 观察时间 | observeAt | left | 170 |
| 上证指数 | shanghaiIndex（formatIndexPoint） | right | 110 |
| 上证50 | sse50Index（formatIndexPoint） | right | 110 |
| 沪深300 | csi300Index（formatIndexPoint） | right | 110 |
| 成交额 | marketTurnover（formatMoney） | right | 120 |
| 市场情绪 | sentiment (tag) | center | 90 |
| 政策事件 | policyEvent（超 40 字截断） | left | flex |
| 宏观备注 | macroNote（超 40 字截断） | left | flex |
| 个人观点 | personalView（超 40 字截断） | left | flex |
| 操作 | — | center | 100 |

**情绪 tag 配色**：极低 → `error`，低 → `warning`，中 → `info`，高 → `success`，极高 → `success`

操作列：`[编辑]` `[删除]`

### 4. `src/features/market-observations/components/MarketObservationForm.vue`

Drawer 表单，width=520px

| 字段 | 组件 | 必填 | 备注 |
|------|------|------|------|
| observeAt | n-date-picker type="datetime" | 是 | 默认当前时间 |
| shanghaiIndex | n-input-number precision=2 | 否 | 上证指数，后缀"点" |
| sse50Index | n-input-number precision=2 | 否 | 上证 50 指数，后缀"点" |
| csi300Index | n-input-number precision=2 | 否 | 沪深 300 指数，后缀"点" |
| marketTurnover | n-input-number precision=2 | 否 | 市场成交额，后缀"元" |
| sentiment | n-select | 否 | 极低/低/中/高/极高 |
| policyEvent | n-input textarea rows=3 | 否 | 政策、监管、行业事件 |
| macroNote | n-input textarea rows=3 | 否 | 宏观、流动性、汇率等备注 |
| personalView | n-input textarea rows=4 | 否 | |

### 5. `src/pages/market-observations/MarketObservationsPage.vue`

- 标题：市场观察 / 记录市场环境和你的判断
- 操作按钮：`[+ 新增观察]`
- 筛选区：日期范围 + 市场情绪 + [搜索] [重置]
- 表格 + 表单 Drawer

### 6. 模块导出文件

## 代码风格

- 参考 Assets 模块
- 禁止 any 类型
