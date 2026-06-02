import { describe, expect, it } from 'vitest'
import { validateAsset } from './asset'

describe('validateAsset', () => {
  it('should return valid for complete correct data', () => {
    const result = validateAsset({
      code: '510300',
      name: '沪深300ETF',
      type: 'etf',
      market: 'CN',
      riskLevel: 2,
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('should return valid when optional fields are missing', () => {
    const result = validateAsset({
      code: '510300',
      name: '沪深300ETF',
      type: 'etf',
      market: 'CN',
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  // ─── code validation ───────────────────────────────────────────────────

  describe('code validation', () => {
    it('should error on empty code', () => {
      const result = validateAsset({ code: '', name: 'Test', type: 'etf', market: 'CN' })
      expect(result.valid).toBe(false)
      expect(result.errors.code).toBe('请输入标的代码')
    })

    it('should error on whitespace-only code', () => {
      const result = validateAsset({ code: '   ', name: 'Test', type: 'etf', market: 'CN' })
      expect(result.valid).toBe(false)
      expect(result.errors.code).toBe('请输入标的代码')
    })

    it('should error on undefined code', () => {
      const result = validateAsset({ name: 'Test', type: 'etf', market: 'CN' })
      expect(result.valid).toBe(false)
      expect(result.errors.code).toBe('请输入标的代码')
    })

    it('should error on code with spaces', () => {
      const result = validateAsset({ code: '51 0300', name: 'Test', type: 'etf', market: 'CN' })
      expect(result.valid).toBe(false)
      expect(result.errors.code).toContain('空格')
    })

    it('should error on code exceeding 20 characters', () => {
      const result = validateAsset({
        code: 'A'.repeat(21),
        name: 'Test',
        type: 'etf',
        market: 'CN',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.code).toContain('超过 20')
    })

    it('should accept code exactly 20 characters', () => {
      const result = validateAsset({
        code: 'A'.repeat(20),
        name: 'Test',
        type: 'etf',
        market: 'CN',
      })
      expect(result.errors.code).toBeUndefined()
    })
  })

  // ─── name validation ──────────────────────────────────────────────────

  describe('name validation', () => {
    it('should error on empty name', () => {
      const result = validateAsset({ code: '510300', name: '', type: 'etf', market: 'CN' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBe('请输入标的名称')
    })

    it('should error on name exceeding 50 characters', () => {
      const result = validateAsset({
        code: '510300',
        name: 'A'.repeat(51),
        type: 'etf',
        market: 'CN',
      })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toContain('超过 50')
    })

    it('should accept name exactly 50 characters', () => {
      const result = validateAsset({
        code: '510300',
        name: 'A'.repeat(50),
        type: 'etf',
        market: 'CN',
      })
      expect(result.errors.name).toBeUndefined()
    })
  })

  // ─── type / market / riskLevel validation ─────────────────────────────

  describe('type validation', () => {
    it('should error when type is missing', () => {
      const result = validateAsset({ code: '510300', name: 'Test', market: 'CN' })
      expect(result.valid).toBe(false)
      expect(result.errors.type).toBe('请选择资产类型')
    })
  })

  describe('market validation', () => {
    it('should error when market is missing', () => {
      const result = validateAsset({ code: '510300', name: 'Test', type: 'etf' })
      expect(result.valid).toBe(false)
      expect(result.errors.market).toBe('请选择市场')
    })
  })

  describe('riskLevel validation', () => {
    it('should error when riskLevel is below 1', () => {
      const result = validateAsset({
        code: '510300',
        name: 'Test',
        type: 'etf',
        market: 'CN',
        riskLevel: 0 as unknown as 1,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.riskLevel).toContain('1 到 5')
    })

    it('should error when riskLevel is above 5', () => {
      const result = validateAsset({
        code: '510300',
        name: 'Test',
        type: 'etf',
        market: 'CN',
        riskLevel: 6 as unknown as 1,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.riskLevel).toContain('1 到 5')
    })

    it('should accept riskLevel at boundary values 1 and 5', () => {
      const r1 = validateAsset({
        code: '510300',
        name: 'Test',
        type: 'etf',
        market: 'CN',
        riskLevel: 1,
      })
      const r5 = validateAsset({
        code: '510300',
        name: 'Test',
        type: 'etf',
        market: 'CN',
        riskLevel: 5,
      })
      expect(r1.errors.riskLevel).toBeUndefined()
      expect(r5.errors.riskLevel).toBeUndefined()
    })

    it('should not error when riskLevel is undefined', () => {
      const result = validateAsset({ code: '510300', name: 'Test', type: 'etf', market: 'CN' })
      expect(result.errors.riskLevel).toBeUndefined()
    })
  })

  // ─── multiple errors ───────────────────────────────────────────────────

  it('should report multiple errors at once', () => {
    const result = validateAsset({})
    expect(result.valid).toBe(false)
    expect(result.errors.code).toBeDefined()
    expect(result.errors.name).toBeDefined()
    expect(result.errors.type).toBeDefined()
    expect(result.errors.market).toBeDefined()
    expect(Object.keys(result.errors)).toHaveLength(4)
  })
})
