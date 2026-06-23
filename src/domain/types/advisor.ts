/*
 * @Description: 投顾推荐类型定义（金额字段存「分」）
 *
 * 与 Rust models/advisor.rs 对齐，字段名用 camelCase（serde 在 Rust 端做转换）。
 */

/** 推荐方向 */
export type AdvisorDirection = 'buy' | 'sell'

/** 投顾推荐信号 */
export type AdvisorSignal = {
  id: number
  advisor: string
  assetId: number
  direction: AdvisorDirection
  signalAt: string
  /** 推荐参考价（分） */
  refPrice: number
  /** 目标价（分，可空） */
  targetPrice: number | null
  /** 止损位（分，可空） */
  stopLoss: number | null
  /** 假设仓位（股数） */
  hypotheticalQty: number
  note: string | null
  createdAt: string
  updatedAt: string
  // JOIN 字段（来自 assets 表）
  assetCode?: string | null
  assetName?: string | null
  assetMarket?: string | null
}

export type AdvisorSignalCreatePayload = Omit<
  AdvisorSignal,
  'id' | 'createdAt' | 'updatedAt' | 'assetCode' | 'assetName' | 'assetMarket'
>

export type AdvisorSignalUpdatePayload = Omit<
  AdvisorSignal,
  'createdAt' | 'updatedAt' | 'assetCode' | 'assetName' | 'assetMarket'
>

/** 跟随 + 复盘记录 */
export type FollowUp = {
  id: number
  signalId: number
  followed: boolean
  actualPrice: number | null
  actualQty: number | null
  actualAt: string | null
  linkedTradeId: number | null
  reason: string | null
  rangeHigh: number | null
  rangeLow: number | null
  rangeEndClose: number | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type FollowUpUpsertPayload = Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>

/** 推荐方向标签 */
export const ADVISOR_DIRECTION_LABELS: Record<AdvisorDirection, string> = {
  buy: '买入推荐',
  sell: '卖出推荐',
}
