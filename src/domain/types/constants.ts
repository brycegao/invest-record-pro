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
export const MOODS = [
  'calm',
  'anxious',
  'greedy',
  'fearful',
  'hesitant',
  'other',
  'unknown',
] as const
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
