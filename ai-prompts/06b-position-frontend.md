# Batch 6b：Positions 模块 — 前端全套（Repository + Store + 服务 + UI）

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义在 `src/domain/types/`：Position, PositionItem, PositionCreatePayload, PositionAssetPrice
- 金融工具函数在 `src/domain/types/financial.ts`
- Assets/Plans/Trades 模块已完整实现
- Rust 后端已实现：get_positions, create_position_snapshot, get_position_items, delete_position, get_latest_position

## 任务

生成 Positions 模块的前端全套代码。

## 生成文件清单

### 1. `src/features/positions/repository.ts`

```ts
export async function getPositions(): Promise<Position[]>
export async function createPositionSnapshot(payload: PositionCreatePayload): Promise<Position>
export async function getPositionItems(positionId: number): Promise<PositionItem[]>
export async function deletePosition(id: number): Promise<void>
export async function getLatestPosition(): Promise<Position | null>
```

**精度转换**：createPositionSnapshot 的 payload 中 cash/totalAssets/unrealizedPnl/realizedPnl 是分（yuanToFen），items 中的 avgCost/currentPrice 是分（yuanToFen），quantity 是 ×1000（storeQuantity），marketValue 和 unrealizedPnl 是分（yuanToFen）。

### 2. `src/features/positions/store.ts`

usePositionStore（Setup Store 风格）：
- State：positions, currentPositionItems, loading, error
- Actions：loadPositions, createSnapshot, loadPositionItems, deletePosition, clearError

### 3. `src/services/position-calculation.service.ts`

仓位计算服务（跨模块服务）：

```ts
/**
 * 根据交易记录计算指定标的的持仓信息
 * 调用 trade repository 获取汇总数据
 */
export async function calculateHolding(assetId: number): Promise<HoldingInfo | null>

type HoldingInfo = {
  assetId: number
  totalBuyQuantity: number    // ×1000
  totalSellQuantity: number   // ×1000
  currentQuantity: number      // ×1000
  avgCost: number              // ×100（分）
  totalBuyAmount: number      // 分
  totalSellAmount: number     // 分
}

/**
 * 获取所有有持仓的标的列表
 * 遍历所有 assets，查询各自的 trade_summary，过滤出 currentQuantity > 0 的
 */
export async function getAllHoldings(): Promise<HoldingInfo[]>

/**
 * 计算仓位占比（前端实时计算，不存数据库）
 */
export function calculatePositionRatio(marketValue: number, totalAssets: number): number
// totalAssets 为 0 时返回 0
```

注意：此服务需要调用 trades 的 repository。由于"不允许跨模块直接导入"的约束，应通过 `src/services/` 层调用 trades repository，而不是直接 import features。

实际操作：在 `src/services/` 下创建一个 `trade-query.service.ts`，封装跨模块查询功能：

```ts
// src/services/trade-query.service.ts
import { invoke } from '@tauri-apps/api/core'

/** 跨模块查询：获取指定标的的交易汇总（避免 features/trades 直接被其他 features 导入） */
export async function getTradeSummaryByAsset(assetId: number): Promise<TradeSummary>
```

### 4. `src/pages/positions/PositionsPage.vue`

页面结构：

**顶部：当前持仓摘要卡片（n-grid cols=4）**

| 卡片 | 数据 | 格式 |
|------|------|------|
| 总资产 | 最新快照 totalAssets | formatMoney |
| 现金 | 最新快照 cash | formatMoney |
| 浮动盈亏 | 最新快照 unrealizedPnl | formatSignedMoney + getMoneyColor |
| 已实现盈亏 | 最新快照 realizedPnl | formatSignedMoney + getMoneyColor |

使用 n-statistic + n-card。模板示例：

```vue
<n-grid cols="4" x-gap="16" y-gap="16" style="margin-bottom: 16px">
  <n-grid-item>
    <n-card>
      <n-statistic label="总资产" :value="formatMoney(latestSnapshot.totalAssets)" />
    </n-card>
  </n-grid-item>
  <n-grid-item>
    <n-card>
      <n-statistic label="现金" :value="formatMoney(latestSnapshot.cash)" />
    </n-card>
  </n-grid-item>
  <n-grid-item>
    <n-card>
      <n-statistic label="浮动盈亏" :value="formatSignedMoney(latestSnapshot.unrealizedPnl)" />
    </n-card>
  </n-grid-item>
  <n-grid-item>
    <n-card>
      <n-statistic label="已实现盈亏" :value="formatSignedMoney(latestSnapshot.realizedPnl)" />
    </n-card>
  </n-grid-item>
</n-grid>
```

**筛选区**：日期范围选择（n-date-picker type="daterange"）+ [搜索] [重置]

**快照列表表格**：

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 快照时间 | snapshotAt | left | 170 |
| 现金 | cash | right | 120 |
| 总资产 | totalAssets | right | 130 |
| 浮动盈亏 | unrealizedPnl | right | 130 |
| 已实现盈亏 | realizedPnl | right | 130 |
| 操作 | — | center | 100 |

操作列：`[查看明细]` `[删除]`（n-popconfirm）

### 5. `src/features/positions/components/PositionDetailDrawer.vue`

查看明细抽屉：

- **Drawer 宽度 640px**
- 标题："仓位明细 — YYYY-MM-DD"

**汇总信息（n-descriptions 两列布局）**：
- 总资产、现金、持仓市值、浮动盈亏、已实现盈亏

**仓位明细表格**：

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 标的 | assetCode + assetName | left | 120 |
| 持仓数量 | quantity（displayQuantity） | right | 100 |
| 成本价 | avgCost（fenToYuan） | right | 100 |
| 当前价 | currentPrice（fenToYuan） | right | 100 |
| 市值 | marketValue（formatMoney） | right | 120 |
| 浮动盈亏 | unrealizedPnl（formatSignedMoney） | right | 120 |
| 仓位占比 | 前端计算 | right | 100 |

**仓位占比计算**：`marketValue / totalAssets`，当 totalAssets 为 0 时显示 `—`。使用 formatPercent 格式化。

### 6. `src/features/positions/components/CreateSnapshotDrawer.vue`

手动生成快照抽屉：

- **Drawer 宽度 480px**
- 标题："生成仓位快照"

**表单字段**：

| 字段 | 组件 | 必填 | 备注 |
|------|------|------|------|
| snapshotAt | n-date-picker type="date" | 是 | 默认今天 |
| totalAssets | n-input-number precision=2 | 是 | 后缀"元" |
| cash | n-input-number precision=2 | 是 | 后缀"元" |

**各标的当前价格区**（分隔线下方）：

调用 `getAllHoldings()` 获取所有有持仓的标的，动态生成输入行：

```
510050 当前价  [n-input-number precision=2]  元
510300 当前价  [n-input-number precision=2]  元
```

每行显示资产代码、资产名称，和当前价输入框。

**自动计算**（输入当前价后实时计算）：
- 市值 = currentPrice × displayQuantity
- 浮动盈亏 = (currentPrice - fenToYuan(avgCost)) × displayQuantity

计算结果以灰色小字显示在每行右侧。

**提交时**：
- totalAssets/cash 转为分（yuanToFen）
- 遍历持仓标的，组装 position_items
  - quantity/avg_cost 保持数据库存储值
  - current_price = yuanToFen(inputPrice)
  - market_value = yuanToFen(currentPrice) × displayQuantity → 再转为分
  - unrealized_pnl = 计算值转为分
- 调用 createPositionSnapshot

### 7. 模块导出文件

- `src/features/positions/index.ts`
- `src/features/positions/components/index.ts`

## 代码风格

- 参考 Assets 模块代码风格
- 禁止 any 类型
- 使用 `@/` 路径别名
- 金融数值必须通过 financial.ts 工具函数转换
