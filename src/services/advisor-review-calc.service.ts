/*
 * @Description: 投顾复盘计算 — 8 状态分类（金额用「分」）
 *
 * 评估对象是「我的操作是否让收益最大化」，不是评估老师对错。
 * 三维决定状态：direction（老师方向）+ followed（我是否跟随）+ 后市涨跌。
 *
 * 8 状态矩阵：
 *   direction=buy:
 *     followed + 涨 → followed_buy_gain   我买了且涨 → 跟随获利 ✅
 *     followed + 跌 → followed_buy_loss   我买了且跌 → 跟随亏损 ⚠️
 *     未跟随  + 涨 → missed_buy           我没买且涨 → 踏空 ❌
 *     未跟随  + 跌 → avoided_buy          我没买且跌 → 躲过下跌 ✅
 *   direction=sell:
 *     followed + 涨 → followed_sell_rise  我卖了且涨 → 卖飞了 ⚠️
 *     followed + 跌 → followed_sell_drop  我卖了且跌 → 逃顶成功 ✅
 *     未跟随  + 涨 → held_through_gain    我没卖且涨 → 正确持筹 ✅
 *     未跟随  + 跌 → held_through_loss    我没卖且跌 → 死扛被套 ❌
 */

export type OutcomeType =
  | 'followed_buy_gain'
  | 'followed_buy_loss'
  | 'missed_buy'
  | 'avoided_buy'
  | 'followed_sell_drop'
  | 'followed_sell_rise'
  | 'held_through_gain'
  | 'held_through_loss'

/** 正确决策集合（我做对了） */
const CORRECT_OUTCOMES: ReadonlySet<OutcomeType> = new Set<OutcomeType>([
  'followed_buy_gain',
  'avoided_buy',
  'followed_sell_drop',
  'held_through_gain',
])

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  followed_buy_gain: '跟随获利',
  followed_buy_loss: '跟随亏损',
  missed_buy: '踏空',
  avoided_buy: '躲过下跌',
  followed_sell_drop: '逃顶成功',
  followed_sell_rise: '卖飞了',
  held_through_gain: '正确持筹',
  held_through_loss: '死扛被套',
}

/** 各状态的详细说明（复盘弹窗展示用） */
export const OUTCOME_DESCRIPTIONS: Record<OutcomeType, string> = {
  followed_buy_gain: '老师让买，我买了，后市上涨 → 正确跟随获利',
  followed_buy_loss: '老师让买，我买了，后市下跌 → 跟随导致亏损',
  missed_buy: '老师让买，我没买，后市上涨 → 错过上涨，该买没买',
  avoided_buy: '老师让买，我没买，后市下跌 → 躲过下跌，判断正确',
  followed_sell_drop: '老师让卖，我卖了，后市下跌 → 成功逃顶',
  followed_sell_rise: '老师让卖，我卖了，后市上涨 → 卖早了，错过后续上涨',
  held_through_gain: '老师让卖，我没卖，后市上涨 → 坚定持筹赚更多',
  held_through_loss: '老师让卖，我没卖，后市下跌 → 该卖没卖，死扛被套',
}

/** Naive UI Tag 的 type 映射 */
export const OUTCOME_TAG_TYPES: Record<OutcomeType, 'success' | 'warning' | 'error'> = {
  followed_buy_gain: 'success',
  avoided_buy: 'success',
  followed_sell_drop: 'success',
  held_through_gain: 'success',
  followed_buy_loss: 'warning',
  followed_sell_rise: 'warning',
  missed_buy: 'error',
  held_through_loss: 'error',
}

export function isCorrectOutcome(t: OutcomeType): boolean {
  return CORRECT_OUTCOMES.has(t)
}

export interface ReviewInput {
  direction: 'buy' | 'sell'
  /** 推荐参考价（分） */
  refPrice: number
  followed: boolean
  /** 跟随时的实际盈亏（分，仅 followed 时有意义） */
  actualPnl?: number
  /** 假设仓位（股数） */
  hypotheticalQty: number
  /** 区间最高价（分） */
  rangeHigh: number
  /** 区间最低价（分） */
  rangeLow: number
  /** 区间终点收盘价（分） */
  rangeEndClose: number
}

export interface ReviewOutcome {
  outcomeType: OutcomeType
  /** 跟随时的实际盈亏（分） */
  actualPnl?: number
  /** 踏空/卖飞/正确持筹 → 错过或多赚的上涨金额（分） */
  missedAmount?: number
  missedPct?: number
  /** 躲过下跌/逃顶/死扛 → 躲过的下跌或多亏的金额（分） */
  avoidedAmount?: number
  avoidedPct?: number
  /** 正确持筹：没卖多赚的（分） */
  gainedAmount?: number
  gainedPct?: number
  /** 死扛被套：没卖多亏的（分） */
  lostAmount?: number
  lostPct?: number
}

function upAmount(high: number, ref: number, qty: number): number | undefined {
  return qty > 0 ? (high - ref) * qty : undefined
}
function downAmount(ref: number, low: number, qty: number): number | undefined {
  return qty > 0 ? (ref - low) * qty : undefined
}
function upPct(high: number, ref: number): number {
  return (high - ref) / ref
}
function downPct(ref: number, low: number): number {
  return (ref - low) / ref
}

/** 评估单条推荐信号。 */
export function evaluateSignal(inp: ReviewInput): ReviewOutcome {
  const { direction, refPrice, followed, hypotheticalQty: qty, rangeHigh, rangeLow, rangeEndClose } = inp
  const rose = rangeEndClose >= refPrice

  // refPrice <= 0 视为无效，退化（无法判断涨跌）
  if (refPrice <= 0) {
    return { outcomeType: 'held_through_loss' }
  }

  if (direction === 'buy') {
    if (followed) {
      return rose
        ? { outcomeType: 'followed_buy_gain', actualPnl: inp.actualPnl ?? 0 }
        : { outcomeType: 'followed_buy_loss', actualPnl: inp.actualPnl ?? 0 }
    }
    return rose
      ? { outcomeType: 'missed_buy', missedAmount: upAmount(rangeHigh, refPrice, qty), missedPct: upPct(rangeHigh, refPrice) }
      : { outcomeType: 'avoided_buy', avoidedAmount: downAmount(refPrice, rangeLow, qty), avoidedPct: downPct(refPrice, rangeLow) }
  }

  // direction === 'sell'
  if (followed) {
    return rose
      ? { outcomeType: 'followed_sell_rise', missedAmount: upAmount(rangeHigh, refPrice, qty), missedPct: upPct(rangeHigh, refPrice) }
      : { outcomeType: 'followed_sell_drop', avoidedAmount: downAmount(refPrice, rangeLow, qty), avoidedPct: downPct(refPrice, rangeLow) }
  }
  return rose
    ? { outcomeType: 'held_through_gain', gainedAmount: upAmount(rangeHigh, refPrice, qty), gainedPct: upPct(rangeHigh, refPrice) }
    : { outcomeType: 'held_through_loss', lostAmount: downAmount(refPrice, rangeLow, qty), lostPct: downPct(refPrice, rangeLow) }
}

export interface WeeklySummary {
  total: number
  correctCount: number
  wrongCount: number
  /** 决策正确率 = 正确决策数 / 总数 */
  decisionAccuracy: number
  /** 各状态计数 */
  outcomeCounts: Record<OutcomeType, number>
  /** 跟随时的实际盈亏合计（分） */
  followedPnl: number
  /** 踏空 + 卖飞 + 死扛多亏 的金额合计（分，均为"本可避免的损失"） */
  totalRegret: number
}

function emptyOutcomeCounts(): Record<OutcomeType, number> {
  return {
    followed_buy_gain: 0,
    followed_buy_loss: 0,
    missed_buy: 0,
    avoided_buy: 0,
    followed_sell_drop: 0,
    followed_sell_rise: 0,
    held_through_gain: 0,
    held_through_loss: 0,
  }
}

/** 汇总一批 outcome（按老师/周聚合）。 */
export function aggregate(outcomes: ReviewOutcome[]): WeeklySummary {
  const total = outcomes.length
  const outcomeCounts = emptyOutcomeCounts()
  let correctCount = 0
  let followedPnl = 0
  let totalRegret = 0

  for (const o of outcomes) {
    outcomeCounts[o.outcomeType] += 1
    if (isCorrectOutcome(o.outcomeType)) correctCount += 1
    if (o.outcomeType === 'followed_buy_gain' || o.outcomeType === 'followed_buy_loss') {
      followedPnl += o.actualPnl ?? 0
    }
    // "本可避免的损失"：踏空错过的、卖飞错过的、死扛多亏的
    totalRegret += (o.missedAmount ?? 0) + (o.lostAmount ?? 0)
  }

  return {
    total,
    correctCount,
    wrongCount: total - correctCount,
    decisionAccuracy: total > 0 ? correctCount / total : 0,
    outcomeCounts,
    followedPnl,
    totalRegret,
  }
}
