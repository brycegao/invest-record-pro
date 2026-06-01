# Batch 2：共享类型定义 + 金融工具函数

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 定位说明

**本文件是所有业务模块的公共类型层（`src/domain/types/`），必须在 Batch 3-8 的任何模块生成之前完成。**

- 所有后续模块（Assets、Plans、Trades、Positions、Reviews、MarketObservations、MonthlyReports）的 Repository / Store / UI 均从此目录导入类型
- 此处只定义**数据结构和纯工具函数**，不包含任何业务逻辑、Tauri invoke 调用或 Vue 组件
- 类型定义与数据库 schema（Batch 1）一一对应，字段名采用 TypeScript camelCase，存储值单位与 schema 保持一致（金额用分、数量用 ×1000、百分比用 ×100）

## 任务

为所有 8 个业务模块生成 TypeScript 类型定义和金融数值转换工具函数。

## 代码风格要求

- TypeScript `strict: true`，禁止 any 类型
- 数据模型使用 `type`（不用 interface）
- 枚举常量用 `UPPER_SNAKE_CASE`
- 函数 / 变量用 `camelCase`
- 所有 export 函数必须有 JSDoc 注释
- 使用 `@` 路径别名

## 生成文件清单

### 文件 1：`src/domain/types/common.ts`

通用类型：

```ts
/** 分页参数 */
export type PageParams = {
  page: number
  pageSize: number
}

/** 分页结果 */
export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** API 统一返回 */
export type ApiResult<T> = {
  success: boolean
  data?: T
  error?: string
}

/** ID 参数 */
export type IdParam = {
  id: number
}
```

### 文件 2：`src/domain/types/constants.ts`

所有枚举常量：

```ts
/** 资产类型 */
export const ASSET_TYPES = ['stock', 'etf', 'fund', 'index', 'bond'] as const
export type AssetType = (typeof ASSET_TYPES)[number]

/** 市场 */
export const MARKETS = ['CN', 'HK', 'US'] as const
export type Market = (typeof MARKETS)[number]

/** 风险等级 */
export const RISK_LEVELS = [1, 2, 3, 4, 5] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

/** 计划类型 */
export const PLAN_TYPES = ['buy', 'sell'] as const
export type PlanType = (typeof PLAN_TYPES)[number]

/** 计划状态 */
export const PLAN_STATUSES = ['pending', 'partial', 'completed', 'canceled'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

/** 交易类型 */
export const TRADE_TYPES = ['buy', 'sell'] as const
export type TradeType = (typeof TRADE_TYPES)[number]

/** 情绪状态 */
export const MOODS = ['calm', 'anxious', 'greedy', 'fearful', 'hesitant', 'other', 'unknown'] as const
export type Mood = (typeof MOODS)[number]

/** 复盘结果 */
export const REVIEW_RESULTS = ['good', 'bad', 'neutral'] as const
export type ReviewResult = (typeof REVIEW_RESULTS)[number]

/** 问题类型 */
export const ISSUE_TYPES = ['emotion', 'rule', 'discipline', 'external'] as const
export type IssueType = (typeof ISSUE_TYPES)[number]

/** 市场情绪 */
export const SENTIMENTS = ['极低', '低', '中', '高', '极高'] as const
export type Sentiment = (typeof SENTIMENTS)[number]

/** 规则类型 */
export const RULE_TYPES = ['price', 'index', 'volume', 'time'] as const
export type RuleType = (typeof RULE_TYPES)[number]

/** 规则条件运算符 */
export const RULE_OPERATORS = ['>', '<', '>=', '<=', '=='] as const
export type RuleOperator = (typeof RULE_OPERATORS)[number]
```

### 文件 3：`src/domain/types/asset.ts`

```ts
import type { AssetType, Market, RiskLevel } from './constants'

/** 投资标的 */
export type Asset = {
  id: number
  code: string
  name: string
  type: AssetType
  market: Market
  riskLevel: RiskLevel
  indexReference: string | null
  logic: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** 创建资产载荷 */
export type AssetCreatePayload = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>

/** 更新资产载荷 */
export type AssetUpdatePayload = Omit<Asset, 'createdAt' | 'updatedAt'>

/** 资产过滤条件 */
export type AssetFilter = {
  keyword?: string
  type?: AssetType | ''
  market?: Market | ''
}

/** 资产类型标签映射 */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: '股票',
  etf: 'ETF',
  fund: '基金',
  index: '指数',
  bond: '债券',
}

/** 市场标签映射 */
export const MARKET_LABELS: Record<Market, string> = {
  CN: 'A股',
  HK: '港股',
  US: '美股',
}

/** 验证资产数据 */
export function validateAsset(asset: Partial<AssetCreatePayload>): { valid: boolean; errors: Record<string, string> }
```

### 文件 4：`src/domain/types/plan.ts`

```ts
import type { PlanType, PlanStatus, RuleType, RuleOperator } from './constants'

/** 投资计划 */
export type Plan = {
  id: number
  assetId: number
  planType: PlanType
  status: PlanStatus
  positionPercent: number   // 百分比 ×100 存储，如 30% → 3000
  startDate: string | null
  endDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** 计划规则 */
export type PlanRule = {
  id: number
  planId: number
  ruleType: RuleType
  operator: RuleOperator | null
  value: string | null
  createdAt: string
  updatedAt: string
}

/** 创建计划载荷 */
export type PlanCreatePayload = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> & {
  rules?: Omit<PlanRule, 'id' | 'planId' | 'createdAt' | 'updatedAt'>[]
}

/** 更新计划载荷 */
export type PlanUpdatePayload = Omit<Plan, 'createdAt' | 'updatedAt'> & {
  rules?: Omit<PlanRule, 'id' | 'planId' | 'createdAt' | 'updatedAt'>[]
}

/** 计划过滤条件 */
export type PlanFilter = {
  keyword?: string
  planType?: PlanType | ''
  status?: PlanStatus | ''
  startDate?: string
  endDate?: string
}

/** 计划状态标签映射 */
export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  pending: '待执行',
  partial: '部分执行',
  completed: '已完成',
  canceled: '已作废',
}

/** 计划类型标签映射 */
export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  buy: '买入',
  sell: '卖出',
}
```

### 文件 5：`src/domain/types/trade.ts`

```ts
import type { TradeType, Mood } from './constants'

/** 交易记录 */
export type Trade = {
  id: number
  assetId: number
  planId: number | null
  tradeType: TradeType
  quantity: number       // ×1000 存储
  price: number         // ×100 存储（分）
  totalAmount: number    // 分
  fee: number           // 分
  indexPoint: number | null  // ×100 存储
  reason: string | null
  followPlan: boolean
  mood: Mood | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** 创建交易载荷 */
export type TradeCreatePayload = Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>

/** 交易过滤条件 */
export type TradeFilter = {
  keyword?: string
  tradeType?: TradeType | ''
  startDate?: string
  endDate?: string
  followPlan?: boolean | ''
  mood?: Mood | ''
}

/** 交易类型标签映射 */
export const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  buy: '买入',
  sell: '卖出',
}

/** 情绪标签映射 */
export const MOOD_LABELS: Record<Mood, string> = {
  calm: '平静',
  anxious: '焦虑',
  greedy: '贪婪',
  fearful: '恐惧',
  hesitant: '犹豫',
  other: '其他',
  unknown: '未知',
}
```

### 文件 6：`src/domain/types/position.ts`

```ts
/** 仓位快照 */
export type Position = {
  id: number
  snapshotAt: string
  cash: number            // 分
  totalAssets: number    // 分
  unrealizedPnl: number  // 分
  realizedPnl: number   // 分
  createdAt: string
  updatedAt: string
}

/** 仓位明细 */
export type PositionItem = {
  id: number
  positionId: number
  assetId: number
  quantity: number       // ×1000 存储
  avgCost: number        // ×100 存储
  currentPrice: number   // ×100 存储
  marketValue: number   // 分
  unrealizedPnl: number  // 分
  createdAt: string
  updatedAt: string
}

/** 创建快照载荷 */
export type PositionCreatePayload = Omit<Position, 'id' | 'createdAt' | 'updatedAt'> & {
  items: Omit<PositionItem, 'id' | 'positionId' | 'createdAt' | 'updatedAt'>[]
}

/** 创建快照时填写的标的当前价 */
export type PositionAssetPrice = {
  assetId: number
  assetCode: string
  assetName: string
  currentPrice: number  // 显示价格（元）
}
```

### 文件 7：`src/domain/types/review.ts`

```ts
import type { ReviewResult, IssueType } from './constants'

/** 交易复盘 */
export type Review = {
  id: number
  tradeId: number
  result: ReviewResult
  issueType: IssueType | null
  summary: string
  improve: string | null
  createdAt: string
  updatedAt: string
}

/** 创建复盘载荷 */
export type ReviewCreatePayload = Omit<Review, 'id' | 'createdAt' | 'updatedAt'>

/** 复盘过滤条件 */
export type ReviewFilter = {
  keyword?: string
  startDate?: string
  endDate?: string
  result?: ReviewResult | ''
  issueType?: IssueType | ''
}

/** 复盘结果标签映射 */
export const REVIEW_RESULT_LABELS: Record<ReviewResult, string> = {
  good: '好',
  bad: '差',
  neutral: '一般',
}

/** 问题类型标签映射 */
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  emotion: '情绪',
  rule: '规则',
  discipline: '纪律',
  external: '外部',
}
```

### 文件 8：`src/domain/types/market-observation.ts`

```ts
import type { Sentiment } from './constants'

/** 市场观察 */
export type MarketObservation = {
  id: number
  observeAt: string
  indexLevel: number | null   // ×100 存储
  sentiment: Sentiment | null
  event: string | null
  personalView: string | null
  createdAt: string
  updatedAt: string
}

/** 创建市场观察载荷 */
export type MarketObservationCreatePayload = Omit<MarketObservation, 'id' | 'createdAt' | 'updatedAt'>

/** 过滤条件 */
export type MarketObservationFilter = {
  startDate?: string
  endDate?: string
  sentiment?: Sentiment | ''
}

/** 情绪标签映射 */
export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  '极低': '极低',
  '低': '低',
  '中': '中',
  '高': '高',
  '极高': '极高',
}
```

### 文件 9：`src/domain/types/monthly-report.ts`

```ts
/** 月度报告 */
export type MonthlyReport = {
  id: number
  month: string           // YYYY-MM 格式
  inputSnapshotJson: string
  aiSummary: string
  userEditedSummary: string | null
  modelName: string | null
  promptVersion: string | null
  generationDurationMs: number
  createdAt: string
  updatedAt: string
}

/** 创建月报载荷 */
export type MonthlyReportCreatePayload = Omit<MonthlyReport, 'id' | 'createdAt' | 'updatedAt'>

/** 更新月报载荷 */
export type MonthlyReportUpdatePayload = {
  id: number
  userEditedSummary?: string
  aiSummary?: string
}
```

### 文件 10：`src/domain/types/setting.ts`

```ts
/** 系统设置 */
export type Setting = {
  id: number
  key: string
  value: string | null
  createdAt: string
  updatedAt: string
}

/** 设置载荷 */
export type SettingUpsertPayload = {
  key: string
  value: string
}

/** 已知的设置键 */
export const SETTING_KEYS = {
  OLLAMA_URL: 'ollama_url',
  OLLAMA_MODEL: 'ollama_model',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

/** 主题选项 */
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const
export type ThemeOption = (typeof THEME_OPTIONS)[number]
```

### 文件 11：`src/domain/types/financial.ts`

金融数值转换工具函数（所有金额计算的核心工具）：

```ts
/**
 * 分转元（数据库存储 → 前端显示）
 * @param fen 数据库中的分值（INTEGER）
 * @returns 元值
 * @example fenToYuan(350) // 3.50
 */
export function fenToYuan(fen: number): number

/**
 * 元转分（前端输入 → 数据库存储）
 * @param yuan 前端显示的元值
 * @returns 分值
 * @example yuanToFen(3.50) // 350
 */
export function yuanToFen(yuan: number): number

/**
 * 存储数量转显示数量（÷1000）
 * @param stored 数据库存储值（×1000）
 * @returns 显示数量
 * @example displayQuantity(1000000) // 1000
 */
export function displayQuantity(stored: number): number

/**
 * 显示数量转存储数量（×1000）
 * @param display 显示数量
 * @returns 存储值
 * @example storeQuantity(1000) // 1000000
 */
export function storeQuantity(display: number): number

/**
 * 格式化金额（分 → ¥x,xxx.xx 字符串）
 * @param fen 分值
 * @returns 格式化后的金额字符串
 * @example formatMoney(350000) // "¥3,500.00"
 */
export function formatMoney(fen: number): string

/**
 * 格式化带正负号的金额
 * @param fen 分值
 * @returns 带符号的金额字符串（正数绿色，负数红色，零值灰色）
 * @example formatSignedMoney(1234) // "+¥12.34"
 * @example formatSignedMoney(-5678) // "-¥56.78"
 */
export function formatSignedMoney(fen: number): string

/**
 * 格式化百分比（存储值 → 显示值）
 * @param stored 百分比 ×100 存储（如 30% → 3000）
 * @returns 格式化后的百分比字符串
 * @example formatPercent(3000) // "30.0%"
 */
export function formatPercent(stored: number): string

/**
 * 格式化数量
 * @param stored 存储值（×1000）
 * @returns 显示数量字符串
 * @example formatQuantity(1000000) // "1,000"
 */
export function formatQuantity(stored: number): string

/**
 * 格式化指数点位（存储值 → 显示值）
 * @param stored ×100 存储
 * @returns 显示值字符串
 * @example formatIndexPoint(390050) // "3,900.50"
 */
export function formatIndexPoint(stored: number): string

/**
 * 计算总金额（分）
 * 公式：total_amount_fen = price_fen × (quantity_int / 1000)
 * @param priceFen 价格（分）
 * @param quantityInt 数量（×1000 存储）
 * @returns 总金额（分）
 */
export function calculateTotalAmount(priceFen: number, quantityInt: number): number

/**
 * 获取金额对应的 CSS 颜色类名
 * 正数返回绿色，负数返回红色，零值返回灰色
 * @param fen 金额（分）
 * @returns 颜色值
 */
export function getMoneyColor(fen: number): string
```

### 文件 12：`src/domain/types/index.ts`

统一导出所有类型：

```ts
export * from './common'
export * from './constants'
export * from './asset'
export * from './plan'
export * from './trade'
export * from './position'
export * from './review'
export * from './market-observation'
export * from './monthly-report'
export * from './setting'
export * from './financial'
```

## 禁止事项

- 禁止使用 any 类型
- 禁止使用 interface 定义数据模型（用 type）
- createdAt/updatedAt 类型为 string（ISO 8601 字符串），不要用 Date
- 金融数值工具函数中禁止使用浮点运算做等值比较
