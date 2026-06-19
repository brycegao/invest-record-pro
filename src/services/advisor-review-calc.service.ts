/*
 * @Description: 投顾复盘计算 — 踏空/躲避金额（纯函数，金额用「分」）
 *
 * 算法（推荐区间法）：
 *   跟随 → 用 actualPnl
 *   未跟随且 rangeEndClose >= refPrice（净涨）→ 踏空
 *       missedAmount = (rangeHigh - refPrice) * hypotheticalQty（有假设量才算金额）
 *       missedPct    = (rangeHigh - refPrice) / refPrice
 *   未跟随且 rangeEndClose < refPrice（净跌）→ 躲避
 *       avoidedAmount = (refPrice - rangeLow) * hypotheticalQty
 *       avoidedPct    = (refPrice - rangeLow) / refPrice
 */

export type OutcomeType = 'followed' | 'missed_gain' | 'avoided_loss'

export interface ReviewInput {
  /** 推荐参考价（分） */
  refPrice: number
  followed: boolean
  /** 跟随时的实际盈亏（分） */
  actualPnl?: number
  /** 假设仓位（股数） */
  hypotheticalQty: number
  /** 区间最高价（分，手填） */
  rangeHigh: number
  /** 区间最低价（分，手填） */
  rangeLow: number
  /** 区间终点收盘价（分，手填） */
  rangeEndClose: number
}

export interface ReviewOutcome {
  outcomeType: OutcomeType
  actualPnl?: number
  missedAmount?: number
  missedPct?: number
  avoidedAmount?: number
  avoidedPct?: number
}

export interface WeeklySummary {
  total: number
  followedCount: number
  missedCount: number
  avoidedCount: number
  followedPnl: number
  missedAmount: number
  avoidedAmount: number
  accuracy: number
  contribution: number
}

/** 评估单条推荐信号（推荐区间法）。 */
export function evaluateSignal(inp: ReviewInput): ReviewOutcome {
  if (inp.followed) {
    return { outcomeType: 'followed', actualPnl: inp.actualPnl ?? 0 }
  }

  const ref = inp.refPrice
  if (ref <= 0) return { outcomeType: 'avoided_loss' }

  const rose = inp.rangeEndClose >= ref

  if (rose) {
    const amt =
      inp.hypotheticalQty > 0 ? (inp.rangeHigh - ref) * inp.hypotheticalQty : undefined
    const pct = (inp.rangeHigh - ref) / ref
    return { outcomeType: 'missed_gain', missedAmount: amt, missedPct: pct }
  }

  const amt =
    inp.hypotheticalQty > 0 ? (ref - inp.rangeLow) * inp.hypotheticalQty : undefined
  const pct = (ref - inp.rangeLow) / ref
  return { outcomeType: 'avoided_loss', avoidedAmount: amt, avoidedPct: pct }
}

/** 汇总一批 outcome（按老师/周聚合）。 */
export function aggregate(outcomes: ReviewOutcome[]): WeeklySummary {
  const total = outcomes.length
  const followed = outcomes.filter((o) => o.outcomeType === 'followed')
  const missed = outcomes.filter((o) => o.outcomeType === 'missed_gain')
  const avoided = outcomes.filter((o) => o.outcomeType === 'avoided_loss')
  const followedPnl = followed.reduce((s, o) => s + (o.actualPnl ?? 0), 0)
  const missedAmount = missed.reduce((s, o) => s + (o.missedAmount ?? 0), 0)
  const avoidedAmount = avoided.reduce((s, o) => s + (o.avoidedAmount ?? 0), 0)
  const hits = followed.length + missed.length
  return {
    total,
    followedCount: followed.length,
    missedCount: missed.length,
    avoidedCount: avoided.length,
    followedPnl,
    missedAmount,
    avoidedAmount,
    accuracy: total > 0 ? hits / total : 0,
    contribution: followedPnl - missedAmount,
  }
}
