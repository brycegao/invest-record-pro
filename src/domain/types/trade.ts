import type { Mood, TradeType } from './constants'

/** 交易记录 */
export type Trade = {
  id: number
  assetId: number
  planId: number | null
  tradeAt: string
  tradeType: TradeType
  quantity: number
  price: number
  totalAmount: number
  fee: number
  indexPoint: number | null
  reason: string | null
  followPlan: boolean
  mood: Mood | null
  notes: string | null
  createdAt: string
  updatedAt: string
  assetCode?: string | null
  assetName?: string | null
  planStatus?: string | null
  realizedPnl?: number | null
}

/** 创建交易载荷 */
export type TradeCreatePayload = Omit<
  Trade,
  'id' | 'createdAt' | 'updatedAt' | 'assetCode' | 'assetName' | 'planStatus' | 'realizedPnl'
>

/** 更新交易载荷 */
export type TradeUpdatePayload = Omit<
  Trade,
  'createdAt' | 'updatedAt' | 'assetCode' | 'assetName' | 'planStatus' | 'realizedPnl'
>

/** 交易汇总 */
export type TradeSummary = {
  assetId: number
  totalBuyQuantity: number
  totalSellQuantity: number
  currentQuantity: number
  avgCost: number
  remainingCost: number
  realizedPnl: number
  totalBuyAmount: number
  totalSellAmount: number
}

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
