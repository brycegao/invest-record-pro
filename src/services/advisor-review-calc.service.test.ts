/*
 * @Description: 投顾复盘计算单元测试（金额用「分」）
 */
import { describe, it, expect } from 'vitest'
import { evaluateSignal, aggregate, type ReviewInput } from './advisor-review-calc.service'

describe('evaluateSignal', () => {
  it('跟随时返回 followed 并透传 actualPnl', () => {
    const inp: ReviewInput = {
      refPrice: 1000,
      followed: true,
      actualPnl: 32000,
      hypotheticalQty: 0,
      rangeHigh: 0,
      rangeLow: 0,
      rangeEndClose: 0,
    }
    expect(evaluateSignal(inp)).toEqual({ outcomeType: 'followed', actualPnl: 32000 })
  })

  it('未跟随且上涨 → 踏空（有假设量算金额）', () => {
    const inp: ReviewInput = {
      refPrice: 1000,
      followed: false,
      actualPnl: 0,
      hypotheticalQty: 1000,
      rangeHigh: 1200,
      rangeLow: 950,
      rangeEndClose: 1150,
    }
    const out = evaluateSignal(inp)
    expect(out.outcomeType).toBe('missed_gain')
    expect(out.missedAmount).toBe(200000) // (1200-1000)*1000
    expect(out.missedPct).toBeCloseTo(0.2, 9)
  })

  it('未跟随且下跌 → 躲避（有假设量算金额）', () => {
    const inp: ReviewInput = {
      refPrice: 1000,
      followed: false,
      actualPnl: 0,
      hypotheticalQty: 1000,
      rangeHigh: 1020,
      rangeLow: 800,
      rangeEndClose: 850,
    }
    const out = evaluateSignal(inp)
    expect(out.outcomeType).toBe('avoided_loss')
    expect(out.avoidedAmount).toBe(200000) // (1000-800)*1000
    expect(out.avoidedPct).toBeCloseTo(0.2, 9)
  })

  it('未跟随且假设量为 0 → 只返回比例不返回金额', () => {
    const inp: ReviewInput = {
      refPrice: 1000,
      followed: false,
      actualPnl: 0,
      hypotheticalQty: 0,
      rangeHigh: 1200,
      rangeLow: 950,
      rangeEndClose: 1150,
    }
    const out = evaluateSignal(inp)
    expect(out.outcomeType).toBe('missed_gain')
    expect(out.missedAmount).toBeUndefined()
    expect(out.missedPct).toBeCloseTo(0.2, 9)
  })

  it('refPrice <= 0 时退化为 avoided_loss', () => {
    const inp: ReviewInput = {
      refPrice: 0,
      followed: false,
      actualPnl: 0,
      hypotheticalQty: 1000,
      rangeHigh: 0,
      rangeLow: 0,
      rangeEndClose: 0,
    }
    expect(evaluateSignal(inp).outcomeType).toBe('avoided_loss')
  })
})

describe('aggregate', () => {
  it('正确汇总五条 outcome', () => {
    const outcomes = [
      evaluateSignal({
        refPrice: 1000, followed: true, actualPnl: 32000, hypotheticalQty: 0,
        rangeHigh: 0, rangeLow: 0, rangeEndClose: 0,
      }),
      evaluateSignal({
        refPrice: 1000, followed: true, actualPnl: -10000, hypotheticalQty: 0,
        rangeHigh: 0, rangeLow: 0, rangeEndClose: 0,
      }),
      evaluateSignal({
        refPrice: 1000, followed: false, actualPnl: 0, hypotheticalQty: 1000,
        rangeHigh: 1200, rangeLow: 950, rangeEndClose: 1150,
      }),
      evaluateSignal({
        refPrice: 1000, followed: false, actualPnl: 0, hypotheticalQty: 1000,
        rangeHigh: 1150, rangeLow: 950, rangeEndClose: 1100,
      }),
      evaluateSignal({
        refPrice: 1000, followed: false, actualPnl: 0, hypotheticalQty: 1000,
        rangeHigh: 1020, rangeLow: 920, rangeEndClose: 950,
      }),
    ]
    const summary = aggregate(outcomes)
    expect(summary.total).toBe(5)
    expect(summary.followedCount).toBe(2)
    expect(summary.missedCount).toBe(2)
    expect(summary.avoidedCount).toBe(1)
    expect(summary.followedPnl).toBe(22000) // 32000 - 10000
    expect(summary.missedAmount).toBe(350000) // 200000 + 150000
    expect(summary.avoidedAmount).toBe(80000) // (1000-920)*1000
    expect(summary.accuracy).toBeCloseTo(4 / 5, 9)
    expect(summary.contribution).toBe(22000 - 350000)
  })

  it('空列表返回全零', () => {
    const summary = aggregate([])
    expect(summary.total).toBe(0)
    expect(summary.accuracy).toBe(0)
  })
})
