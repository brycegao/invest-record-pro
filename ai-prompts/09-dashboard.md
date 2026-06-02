# Batch 9：Dashboard（仪表盘）页面

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI + ECharts
- 所有 8 个业务模块的 Store 已生成：useAssetsStore, usePlansStore, useTradesStore, usePositionsStore, useReviewsStore, useMarketObservationsStore, useMonthlyReportsStore, useSettingsStore
- 各模块的 Repository 已可正常调用
- 金融工具函数在 `src/domain/types/financial.ts`

## 任务

生成 Dashboard（仪表盘）页面。仪表盘是跨模块聚合页面。

## 生成文件清单

### 1. `src/services/dashboard-aggregation.service.ts`

跨模块数据聚合服务（不直接导入 features 模块，通过 services 层封装）：

```ts
/**
 * 获取仪表盘所需的所有数据
 * 分别调用各模块的 repository 获取数据，聚合计算
 */
export async function getDashboardData(month?: string): Promise<DashboardData>

type DashboardData = {
  // 统计卡片
  totalRealizedPnl: number      // 累计已实现盈亏（分）
  totalUnrealizedPnl: number    // 当前浮动盈亏（分）
  holdingAssetCount: number     // 持仓标的数
  planExecutionRate: number     // 计划执行率（×100 存储）

  // 图表数据
  monthlyPnlTrend: MonthlyPnlPoint[]  // 近 6 个月盈亏趋势
  positionDistribution: PositionDistItem[]  // 当前仓位分布

  // 列表数据
  recentTrades: Trade[]         // 最近 10 条交易
  activePlans: Plan[]           // 最近 5 条活跃计划（非 canceled/completed）
}

type MonthlyPnlPoint = {
  month: string       // "2026-01"
  realizedPnl: number  // 分
  unrealizedPnl: number // 分
}

type PositionDistItem = {
  name: string   // "现金" / "股票" / "ETF" / ...
  value: number  // 分
  percent: number // 0-100
}
```

计算逻辑：
- **totalRealizedPnl**：从最新 position 快照获取 realized_pnl
- **totalUnrealizedPnl**：从最新 position 快照获取 unrealized_pnl
- **holdingAssetCount**：从 trade_summary 获取 currentQuantity > 0 的标的数量
- **planExecutionRate**：(已完成的计划数 + 0.5 × 部分完成的) / (非 canceled 的计划总数) × 100
- **monthlyPnlTrend**：不能用 `trades.total_amount` 直接当盈亏。已实现盈亏必须来自后端按加权平均成本法计算的卖出盈亏；未实现盈亏来自对应月份最新 position snapshot。
- **positionDistribution**：从最新 position_items 聚合，按 asset type 分组

此服务通过 `src/services/trade-query.service.ts` 或 Rust 查询 DTO 获取跨模块数据。若某月份缺少 position snapshot，则该月未实现盈亏显示为 unavailable 或 0，并在 UI 上区分“无快照”。

严禁把买入金额、卖出金额、资金流入流出直接展示为盈亏。

### 2. `src/shared/components/StatCard.vue`

通用统计卡片组件（可复用）：

```vue
Props:
  label: string       // "累计已实现盈亏"
  value: string       // "+¥12,345.67" 或 "5 个"
  color?: string      // 可选颜色类名
  suffix?: string      // 可选后缀，如 "%"
```

使用 n-statistic + n-card，卡片内上方小字标签 + 下方大数字。

### 3. `src/features/dashboard/store.ts`

useDashboardStore（Setup Store 风格）：
- State：dashboardData, loading, error, selectedMonth
- Actions：loadDashboard(month?)
- selectedMonth 变化时重新加载数据

### 4. `src/pages/dashboard/DashboardPage.vue`

完整仪表盘页面：

**月份选择器**：`<n-date-picker type="month" v-model:value="selectedMonth" />`

**上部：4 张统计卡片（n-grid cols=4）**

| 卡片 | 数据 | 格式 |
|------|------|------|
| 累计已实现盈亏 | totalRealizedPnl | formatSignedMoney + getMoneyColor |
| 浮动盈亏 | totalUnrealizedPnl | formatSignedMoney + getMoneyColor |
| 持仓标的数 | holdingAssetCount | "x 个" |
| 计划执行率 | planExecutionRate | formatPercent |

模板示例：

```vue
<n-grid cols="4" x-gap="16" y-gap="16" style="margin-bottom: 16px">
  <n-grid-item>
    <StatCard label="累计已实现盈亏" :value="formatSignedMoney(data.totalRealizedPnl)" />
  </n-grid-item>
  <n-grid-item>
    <StatCard label="浮动盈亏" :value="formatSignedMoney(data.totalUnrealizedPnl)" />
  </n-grid-item>
  <n-grid-item>
    <StatCard label="持仓标的数" :value="`${data.holdingAssetCount} 个`" />
  </n-grid-item>
  <n-grid-item>
    <StatCard label="计划执行率" :value="formatPercent(data.planExecutionRate)" />
  </n-grid-item>
</n-grid>
```

**中部：2 张 ECharts 图表（n-grid cols=2, 高度 280px）**

模板示例：

```vue
<n-grid cols="2" x-gap="16" y-gap="16" style="margin-bottom: 16px">
  <n-grid-item>
    <n-card title="近 6 个月盈亏趋势">
      <div style="height: 280px">
        <v-chart :option="pnlTrendOption" autoresize />
      </div>
    </n-card>
  </n-grid-item>
  <n-grid-item>
    <n-card title="当前仓位分布">
      <div style="height: 280px">
        <v-chart :option="positionDistOption" autoresize />
      </div>
    </n-card>
  </n-grid-item>
</n-grid>
```

1. **近 6 个月盈亏趋势折线图**
   - X 轴：月份
   - Y 轴：金额（元）
   - 双线：已实现（蓝色）、未实现（橙色）
   - 使用 ECharts + vue-echarts

2. **当前仓位分布饼图**
   - 数据：现金、股票、ETF、基金、债券
   - 显示百分比和金额

ECharts 集成方式：使用 `vue-echarts` 库或手动创建 chart 实例。

**底部：2 张列表（n-grid cols=2）**

模板示例：

```vue
<n-grid cols="2" x-gap="16" y-gap="16">
  <n-grid-item>
    <n-card title="最近交易">
      <n-data-table :columns="recentTradeColumns" :data="data.recentTrades" :pagination="false" size="small" />
    </n-card>
  </n-grid-item>
  <n-grid-item>
    <n-card title="活跃计划">
      <n-data-table :columns="activePlanColumns" :data="data.activePlans" :pagination="false" size="small" />
    </n-card>
  </n-grid-item>
</n-grid>
```

列表内容：

1. **最近 10 条交易记录**（简化 n-data-table）
   - 列：时间、标的、类型、金额
   - 无分页

2. **最近 5 条活跃计划**（简化 n-data-table）
   - 列：标的、类型、状态、到期日
   - 无分页

**空状态**：

当所有数据为空时显示：

```
欢迎使用 Invest Record Pro
开始第一步：创建你的第一个投资标的 → [新增标的]
```

## ECharts 引入

确保 `package.json` 中有 `echarts` 和 `vue-echarts` 依赖。如果尚未安装，在 main.ts 或 provider 中注册。

## 代码风格

- 禁止 any 类型
- 使用 `@/` 路径别名
- StatCard 使用 `<script setup lang="ts">`
- 图表配置项独立定义，不内联在 template 中
