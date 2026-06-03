/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 金融工具函数单元测试
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { describe, expect, it } from 'vitest'
import {
  calculateTotalAmount,
  displayQuantity,
  fenToYuan,
  formatIndexPoint,
  formatMoney,
  formatPercent,
  formatQuantity,
  formatSignedMoney,
  getMoneyColor,
  storeQuantity,
  yuanToFen,
} from './financial'

// ─── fenToYuan / yuanToFen ───────────────────────────────────────────────────

describe('fenToYuan', () => {
  it('should convert fen to yuan correctly', () => {
    expect(fenToYuan(100)).toBe(1)
    expect(fenToYuan(0)).toBe(0)
    expect(fenToYuan(1)).toBe(0.01)
    expect(fenToYuan(999)).toBe(9.99)
    expect(fenToYuan(10000)).toBe(100)
    expect(fenToYuan(-100)).toBe(-1)
  })
})

describe('yuanToFen', () => {
  it('should convert yuan to fen with rounding', () => {
    expect(yuanToFen(1)).toBe(100)
    expect(yuanToFen(0)).toBe(0)
    expect(yuanToFen(0.01)).toBe(1)
    expect(yuanToFen(9.99)).toBe(999)
    expect(yuanToFen(100)).toBe(10000)
    expect(yuanToFen(-1)).toBe(-100)
    expect(yuanToFen(1.005)).toBe(100) // rounds down at .005 boundary
    expect(yuanToFen(1.006)).toBe(101) // rounds up
  })

  it('should be inverse of fenToYuan for integer fen values', () => {
    const values = [0, 1, 50, 100, 500, 999, 1000, 5000, 10000, -1, -100]
    for (const fen of values) {
      expect(yuanToFen(fenToYuan(fen))).toBe(fen)
    }
  })
})

// ─── displayQuantity / storeQuantity ─────────────────────────────────────────

describe('displayQuantity', () => {
  it('should divide stored value by 1000', () => {
    expect(displayQuantity(1000)).toBe(1)
    expect(displayQuantity(0)).toBe(0)
    expect(displayQuantity(500)).toBe(0.5)
    expect(displayQuantity(1500)).toBe(1.5)
    expect(displayQuantity(100)).toBe(0.1)
    expect(displayQuantity(-1000)).toBe(-1)
  })
})

describe('storeQuantity', () => {
  it('should multiply display value by 1000 with rounding', () => {
    expect(storeQuantity(1)).toBe(1000)
    expect(storeQuantity(0)).toBe(0)
    expect(storeQuantity(0.5)).toBe(500)
    expect(storeQuantity(1.5)).toBe(1500)
    expect(storeQuantity(0.1)).toBe(100)
    expect(storeQuantity(-1)).toBe(-1000)
    expect(storeQuantity(0.0005)).toBe(1) // rounds to 1 (Math.round)
    expect(storeQuantity(0.0006)).toBe(1) // rounds to 1
  })

  it('should be inverse of displayQuantity for integer stored values', () => {
    const values = [0, 100, 500, 1000, 1500, 10000, -1000]
    for (const stored of values) {
      expect(storeQuantity(displayQuantity(stored))).toBe(stored)
    }
  })
})

// ─── formatMoney ────────────────────────────────────────────────────────────

describe('formatMoney', () => {
  it('should format fen values as yuan with ¥ prefix', () => {
    expect(formatMoney(0)).toBe('¥0.00')
    expect(formatMoney(100)).toBe('¥1.00')
    expect(formatMoney(9999)).toBe('¥99.99')
    expect(formatMoney(1)).toBe('¥0.01')
    expect(formatMoney(1000000)).toBe('¥10,000.00')
  })

  it('should handle negative values', () => {
    expect(formatMoney(-100)).toBe('¥-1.00')
    expect(formatMoney(-1)).toBe('¥-0.01')
  })
})

// ─── formatSignedMoney ──────────────────────────────────────────────────────

describe('formatSignedMoney', () => {
  it('should prepend + for positive values', () => {
    expect(formatSignedMoney(100)).toBe('+¥1.00')
    expect(formatSignedMoney(1)).toBe('+¥0.01')
  })

  it('should prepend - for negative values', () => {
    expect(formatSignedMoney(-100)).toBe('-¥1.00')
    expect(formatSignedMoney(-1)).toBe('-¥0.01')
  })

  it('should not prepend sign for zero', () => {
    expect(formatSignedMoney(0)).toBe('¥0.00')
  })
})

// ─── formatPercent ──────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('should format stored percentage (×100) as human-readable', () => {
    expect(formatPercent(1000)).toBe('10.0%')
    expect(formatPercent(0)).toBe('0.0%')
    expect(formatPercent(5000)).toBe('50.0%')
    expect(formatPercent(-1000)).toBe('-10.0%')
    expect(formatPercent(15)).toBe('0.1%')
  })
})

// ─── formatQuantity ──────────────────────────────────────────────────────────

describe('formatQuantity', () => {
  it('should format stored quantity (×1000) as human-readable', () => {
    expect(formatQuantity(1000)).toBe('1')
    expect(formatQuantity(1500)).toBe('1.5')
    expect(formatQuantity(100)).toBe('0.1')
    expect(formatQuantity(0)).toBe('0')
  })
})

// ─── formatIndexPoint ───────────────────────────────────────────────────────

describe('formatIndexPoint', () => {
  it('should format stored index (×100) as human-readable', () => {
    expect(formatIndexPoint(300000)).toBe('3,000.00')
    expect(formatIndexPoint(100)).toBe('1.00')
    expect(formatIndexPoint(0)).toBe('0.00')
    expect(formatIndexPoint(-100)).toBe('-1.00')
  })
})

// ─── calculateTotalAmount ───────────────────────────────────────────────────

describe('calculateTotalAmount', () => {
  it('should calculate total amount in fen from price and quantity', () => {
    // priceFen * quantityInt / 1000
    // 100 (1元) * 1000 (1份) / 1000 = 100 (1元)
    expect(calculateTotalAmount(100, 1000)).toBe(100)
    expect(calculateTotalAmount(1000, 1000)).toBe(1000)
    expect(calculateTotalAmount(100, 0)).toBe(0)
    expect(calculateTotalAmount(0, 1000)).toBe(0)
  })

  it('should round correctly', () => {
    // 333 * 3 / 1000 = 0.999 → rounds to 1
    expect(calculateTotalAmount(333, 3)).toBe(1)
    // 100 * 15 / 1000 = 1.5 → rounds to 2
    expect(calculateTotalAmount(100, 15)).toBe(2)
  })

  it('should handle negative values', () => {
    expect(calculateTotalAmount(-100, 1000)).toBe(-100)
    expect(calculateTotalAmount(100, -1000)).toBe(-100)
  })
})

// ─── getMoneyColor ──────────────────────────────────────────────────────────

describe('getMoneyColor', () => {
  it('should return positive class for positive values', () => {
    expect(getMoneyColor(1)).toBe('money-positive')
    expect(getMoneyColor(100)).toBe('money-positive')
  })

  it('should return negative class for negative values', () => {
    expect(getMoneyColor(-1)).toBe('money-negative')
    expect(getMoneyColor(-100)).toBe('money-negative')
  })

  it('should return zero class for zero', () => {
    expect(getMoneyColor(0)).toBe('money-zero')
  })
})
