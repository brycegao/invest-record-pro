/*
 * @Description: 投顾复盘计算单元测试 — 8 状态分类（金额用「分」）
 *
 * 评估对象是「我的操作是否让收益最大化」，不是评估老师对错。
 * 三维决定状态：direction（老师方向）+ followed（我是否跟随）+ 后市涨跌。
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateSignal,
  aggregate,
  OUTCOME_LABELS,
  type OutcomeType,
} from './advisor-review-calc.service'

describe('evaluateSignal — 老师让买', () => {
  const buyBase = {
    direction: 'buy' as const,
    refPrice: 1000,
    hypotheticalQty: 1000,
    rangeHigh: 1200,
    rangeLow: 800,
    actualPnl: 0,
  }

  it('我买了 + 涨 → followed_buy_gain（跟随获利）', () => {
    const out = evaluateSignal({ ...buyBase, followed: true, actualPnl: 180000, rangeEndClose: 1180 })
    expect(out.outcomeType).toBe('followed_buy_gain')
    expect(out.actualPnl).toBe(180000)
  })

  it('我买了 + 跌 → followed_buy_loss（跟随亏损）', () => {
    const out = evaluateSignal({ ...buyBase, followed: true, actualPnl: -150000, rangeEndClose: 850 })
    expect(out.outcomeType).toBe('followed_buy_loss')
    expect(out.actualPnl).toBe(-150000)
  })

  it('我没买 + 涨 → missed_buy（踏空）', () => {
    const out = evaluateSignal({ ...buyBase, followed: false, rangeEndClose: 1150 })
    expect(out.outcomeType).toBe('missed_buy')
    expect(out.missedAmount).toBe(200000) // (1200-1000)*1000
    expect(out.missedPct).toBeCloseTo(0.2, 9)
  })

  it('我没买 + 跌 → avoided_buy（躲过下跌）', () => {
    const out = evaluateSignal({ ...buyBase, followed: false, rangeEndClose: 850 })
    expect(out.outcomeType).toBe('avoided_buy')
    expect(out.avoidedAmount).toBe(200000) // (1000-800)*1000
    expect(out.avoidedPct).toBeCloseTo(0.2, 9)
  })
})

describe('evaluateSignal — 老师让卖', () => {
  const sellBase = {
    direction: 'sell' as const,
    refPrice: 1000,
    hypotheticalQty: 1000,
    rangeHigh: 1200,
    rangeLow: 800,
    actualPnl: 0,
  }

  it('我卖了 + 跌 → followed_sell_drop（逃顶成功）', () => {
    const out = evaluateSignal({ ...sellBase, followed: true, actualPnl: 0, rangeEndClose: 850 })
    expect(out.outcomeType).toBe('followed_sell_drop')
    // 逃顶躲过的下跌金额 = (refPrice - rangeLow) * qty
    expect(out.avoidedAmount).toBe(200000)
  })

  it('我卖了 + 涨 → followed_sell_rise（卖飞了）', () => {
    const out = evaluateSignal({ ...sellBase, followed: true, actualPnl: 0, rangeEndClose: 1150 })
    expect(out.outcomeType).toBe('followed_sell_rise')
    // 卖飞错过的上涨 = (rangeHigh - refPrice) * qty
    expect(out.missedAmount).toBe(200000)
  })

  it('我没卖 + 涨 → held_through_gain（正确持筹）', () => {
    const out = evaluateSignal({ ...sellBase, followed: false, rangeEndClose: 1150 })
    expect(out.outcomeType).toBe('held_through_gain')
    // 没卖多赚的 = (rangeHigh - refPrice) * qty
    expect(out.gainedAmount).toBe(200000)
  })

  it('我没卖 + 跌 → held_through_loss（死扛被套）', () => {
    const out = evaluateSignal({ ...sellBase, followed: false, rangeEndClose: 850 })
    expect(out.outcomeType).toBe('held_through_loss')
    // 没卖多亏的 = (refPrice - rangeLow) * qty
    expect(out.lostAmount).toBe(200000)
  })
})

describe('evaluateSignal — 边界', () => {
  it('假设量为 0 时，踏空只返回比例不返回金额', () => {
    const out = evaluateSignal({
      direction: 'buy', refPrice: 1000, followed: false, hypotheticalQty: 0,
      rangeHigh: 1200, rangeLow: 800, rangeEndClose: 1150, actualPnl: 0,
    })
    expect(out.outcomeType).toBe('missed_buy')
    expect(out.missedAmount).toBeUndefined()
    expect(out.missedPct).toBeCloseTo(0.2, 9)
  })

  it('refPrice <= 0 时退化为 held_through_loss', () => {
    const out = evaluateSignal({
      direction: 'buy', refPrice: 0, followed: false, hypotheticalQty: 1000,
      rangeHigh: 0, rangeLow: 0, rangeEndClose: 0, actualPnl: 0,
    })
    expect(out.outcomeType).toBe('held_through_loss')
  })
})

describe('OUTCOME_LABELS — 8 状态都有中文标签', () => {
  const allTypes: OutcomeType[] = [
    'followed_buy_gain', 'followed_buy_loss', 'missed_buy', 'avoided_buy',
    'followed_sell_drop', 'followed_sell_rise', 'held_through_gain', 'held_through_loss',
  ]
  for (const t of allTypes) {
    it(`${t} 有标签`, () => {
      expect(OUTCOME_LABELS[t]).toBeTruthy()
    })
  }
})

describe('aggregate — 决策正确率', () => {
  it('正确率 = 正确决策数 / 总数', () => {
    const outcomes = [
      // 正确决策：跟随获利、躲过下跌、逃顶成功、正确持筹
      evaluateSignal({ direction: 'buy', refPrice: 1000, followed: true, actualPnl: 50000, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 1050 }),
      evaluateSignal({ direction: 'buy', refPrice: 1000, followed: false, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 850 }),
      evaluateSignal({ direction: 'sell', refPrice: 1000, followed: true, actualPnl: 0, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 850 }),
      evaluateSignal({ direction: 'sell', refPrice: 1000, followed: false, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 1150 }),
      // 错误决策：踏空、跟随亏损、卖飞、死扛
      evaluateSignal({ direction: 'buy', refPrice: 1000, followed: false, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 1150 }),
      evaluateSignal({ direction: 'buy', refPrice: 1000, followed: true, actualPnl: -30000, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 970 }),
      evaluateSignal({ direction: 'sell', refPrice: 1000, followed: true, actualPnl: 0, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 1150 }),
      evaluateSignal({ direction: 'sell', refPrice: 1000, followed: false, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 800, rangeEndClose: 850 }),
    ]
    const sum = aggregate(outcomes)
    expect(sum.total).toBe(8)
    expect(sum.correctCount).toBe(4)
    expect(sum.wrongCount).toBe(4)
    expect(sum.decisionAccuracy).toBeCloseTo(0.5, 9)
  })

  it('空列表返回全零', () => {
    const sum = aggregate([])
    expect(sum.total).toBe(0)
    expect(sum.decisionAccuracy).toBe(0)
  })
})
