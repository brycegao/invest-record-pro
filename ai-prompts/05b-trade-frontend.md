# Batch 5b：Trades 模块 — 前端全套（Repository + Store + UI）

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义在 `src/domain/types/`：Trade, TradeCreatePayload, TradeFilter, TradeType, MOODS, TRADE_TYPE_LABELS, MOOD_LABELS
- 金融工具函数在 `src/domain/types/financial.ts`：formatMoney, fenToYuan, yuanToFen, storeQuantity, displayQuantity, formatQuantity, formatSignedMoney, getMoneyColor, calculateTotalAmount
- Assets 和 Plans 模块已完整实现，参考 `src/features/assets/` 代码风格
- Rust 后端已实现：get_trades, create_trade, update_trade, delete_trade, query_trades, get_trade_summary
- Trade DTO 已在 Rust 中包含 asset_code, asset_name, plan_status, realized_pnl 可选字段；realized_pnl 由 Rust 按交易顺序计算，不是数据库字段

## 任务

生成 Trades 模块的前端全套代码。此模块较复杂，包含买入/卖出两个不同表单。

## 生成文件清单

### 1. `src/features/trades/repository.ts`

```ts
export async function getTrades(): Promise<Trade[]>
export async function createTrade(payload: TradeCreatePayload): Promise<Trade>
export async function updateTrade(payload: TradeUpdatePayload): Promise<Trade>
export async function deleteTrade(id: number): Promise<void>
export async function queryTrades(filter: TradeFilter): Promise<Trade[]>
export async function getTradeSummary(assetId: number): Promise<TradeSummary>
```

**关键精度转换**：
- `createTrade` 的 payload 中 price 是分（yuanToFen），quantity 是 ×1000（storeQuantity）
- `tradeAt` 是实际成交时间，必须由表单提交；不要用 `createdAt` 代替成交时间
- 前端输入的是元/显示量，调用 repository 前必须转换
- 建议在 repository 层做转换，或者由调用方（表单组件）转换后传入

### 2. `src/features/trades/store.ts`

useTradeStore（Setup Store 风格）：
- State：trades, loading, error, filters
- Actions：loadTrades, searchTrades, createTrade, updateTrade, deleteTrade, setFilters, clearError
- 同参考 Assets Store 的错误处理模式

### 3. `src/features/trades/components/TradeTable.vue`

**默认开启 scroll-x 横向滚动**。

**默认显示列**：

| 列 | 字段 | 对齐 | 排序 | 宽度 |
|----|------|------|------|------|
| 成交时间 | tradeAt | left | ✓ | 170 |
| 标的 | assetCode + assetName | left | — | 120 |
| 类型 | tradeType (tag) | center | ✓ | 60 |
| 价格 | price（fenToYuan） | right | ✓ | 100 |
| 数量 | quantity（displayQuantity） | right | ✓ | 100 |
| 总金额 | totalAmount（formatMoney） | right | ✓ | 120 |
| 已实现盈亏 | 计算字段 | right | ✓ | 120 |
| 关联计划 | planCode | center | — | 100 |
| 遵守计划 | followPlan (tag) | center | ✓ | 90 |
| 操作 | — | center | — | 140 |

**tag 配色**：
- tradeType：buy → `success`，sell → `error`
- followPlan：true → `success`（是），false → `error`（否），null → `default`

**已实现盈亏计算规则**：
- 买入交易：显示 `—`（灰色，使用 `n-text depth="3"`）
- 卖出交易：优先显示 Rust 返回的 `realizedPnl` DTO 字段。
- 不要在前端表格里用当前 `getTradeSummary(assetId)` 反推历史卖出盈亏，因为历史卖出必须按交易发生时点的加权平均成本计算。
- `realizedPnl` 不是数据库字段；不要修改 schema 只为了表格显示。若 Rust 未返回该字段，表格显示 `—` 并在后端修复。

**金额列格式**：使用 `formatMoney(fen)`，千分位 + 2 位小数，右对齐。
**数量列格式**：使用 `formatQuantity(qty)`。
**价格列格式**：`(fenToYuan(price)).toFixed(2)`

**列显示控制**：表格右上角提供按钮（n-popover + n-checkbox-group），允许用户勾选显示/隐藏以下默认隐藏列：
- 手续费 (fee)：right, 90px
- 情绪 (mood)：center, 80px

Props 增加 `hiddenColumns: string[]`，内部管理列显示状态。

**操作列**：`[编辑]` `[复盘]` `[删除]`
- `[复盘]`：emit `review` 事件，父组件跳转到复盘页面（路由跳转：`router.push({ path: '/reviews', query: { tradeId: row.id } })`）
- `[删除]`：n-popconfirm 确认

### 4. `src/features/trades/components/BuyTradeForm.vue`

买入抽屉表单：

**Drawer 配置**：width=520, 标题 "买入"

**核心字段区**（必须填写）：

| 字段 | 组件 | 必填 | 备注 |
|------|------|------|------|
| tradeAt | n-date-picker type="datetime" | 是 | 实际成交时间，默认当前时间 |
| assetId | n-select | 是 | 远程搜索 assets |
| price | n-input-number | 是 | precision=2, step=0.01, 后缀"元" |
| quantity | n-input-number | 是 | precision=3, min=0.001, 后缀"手/份" |

**自动计算（只读显示）**：

```
总金额（自动计算）  ¥x,xxx.xx
公式：price × quantity
```

当 price 或 quantity 变化时，使用 `calculateTotalAmount` 计算并显示 `formatMoney(totalFen)`。

**可选字段区**（默认折叠，点击"更多选项"展开）：

使用 `n-collapse` 或 `n-collapse-item` 折叠：

| 字段 | 组件 | 默认值 | 备注 |
|------|------|--------|------|
| fee | n-input-number | 0 | precision=2, min=0, 后缀"元" |
| indexPoint | n-input-number | 无 | precision=2, 后缀"点" |
| reason | n-input textarea rows=2 | 无 | |
| followPlan | n-switch | true | |
| planId | n-select | 无 | 仅当 followPlan=true 时显示，筛选该标的的 buy 类型计划 |
| mood | n-select | "calm" | |
| notes | n-input textarea rows=2 | 无 | |

**极简录入原则**：用户只需填 3 个字段（标的、价格、数量）即可提交。

**提交时转换**：
- price → yuanToFen(price)
- quantity → storeQuantity(quantity)
- fee → yuanToFen(fee) 或 0
- totalAmount → calculateTotalAmount(priceFen, quantityInt)

### 5. `src/features/trades/components/SellTradeForm.vue`

卖出抽屉表单：

**Drawer 配置**：width=520, 标题 "卖出"

**核心字段区**：

| 字段 | 组件 | 必填 | 备注 |
|------|------|------|------|
| tradeAt | n-date-picker type="datetime" | 是 | 实际成交时间，默认当前时间 |
| assetId | n-select | 是 | 远程搜索 assets，选择后查询持仓 |
| quantity | n-input-number | 是 | precision=3, max=当前持仓量 |
| price | n-input-number | 是 | precision=2, step=0.01, 后缀"元" |

**持仓信息显示**（选择标的后显示）：

选择 assetId 后，调用 `getTradeSummary(assetId)` 并显示：

```
当前持仓：xxx 手，成本价 ¥x.xx，可用 xxx 手
```

如果当前持仓为 0，显示警告信息且禁用提交按钮。

**卖出校验**：`quantity` 的 `max` 动态绑定当前持仓的 displayQuantity。超出时 n-form-item 报错。

**预计盈亏（自动计算，只读）**：

```
预计盈亏  ±¥x,xxx.xx（红/绿）
公式：(sell_price - avg_cost) × sell_quantity - fee(default=0)
```

使用 `getMoneyColor` 设置颜色。

注意：这是提交前的即时预估，使用当前持仓摘要的 avgCost；最终已实现盈亏以后端按完整交易序列计算结果为准。

**可选字段区**：同买入，但不显示 planId 关联的 buy 类型计划，而是筛选 sell 类型计划。

### 6. `src/pages/trades/TradesPage.vue`

页面组件：

- 标题：交易记录 / 记录每一笔实际成交
- 操作按钮：`[+ 买入]` `[+ 卖出]` `[导出 CSV]`
- 筛选区：标的搜索 + 交易类型 + 日期范围 + 是否遵守计划 + 情绪状态 + [搜索] [重置]
- 表格：TradeTable
- 买入 Drawer：BuyTradeForm
- 卖出 Drawer：SellTradeForm

**布局规范**：
- 页面结构与 `src/pages/assets/AssetsPage.vue` 一致
- 使用 `NSpace` 组件做水平排列（按钮行、筛选行），通过 `align` prop 控制对齐
- 使用 `style="margin-bottom: 16px"` 等内联样式控制垂直间距
- **禁止使用 Tailwind CSS 类**（项目未安装 Tailwind）
- 标题区参考 03f AssetsPage 的写法（h2 + p，内联 style 控制字号和间距）

`[+ 买入]` 打开 BuyTradeForm，`[+ 卖出]` 打开 SellTradeForm。

### 7. 模块导出文件

- `src/features/trades/index.ts`
- `src/features/trades/components/index.ts`

## 代码风格

- 参考 `src/features/assets/` 代码风格
- 禁止 any 类型
- 使用 `@/` 路径别名
- 金融数值必须通过 financial.ts 工具函数转换
