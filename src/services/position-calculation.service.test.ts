import { describe, expect, it, vi, beforeEach } from 'vitest'
import { calculatePositionRatio } from './position-calculation.service'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// ─── calculatePositionRatio (pure function, no mocks needed) ────────────────

describe('calculatePositionRatio', () => {
  it('should return 0 when totalAssets is 0', () => {
    expect(calculatePositionRatio(1000, 0)).toBe(0)
    expect(calculatePositionRatio(0, 0)).toBe(0)
  })

  it('should return correct ratio for positive values', () => {
    expect(calculatePositionRatio(50000, 100000)).toBe(0.5)
    expect(calculatePositionRatio(25000, 100000)).toBe(0.25)
    expect(calculatePositionRatio(100000, 100000)).toBe(1)
  })

  it('should return ratio greater than 1 when marketValue exceeds totalAssets', () => {
    expect(calculatePositionRatio(150000, 100000)).toBe(1.5)
  })

  it('should handle negative marketValue (debt/loss scenario)', () => {
    expect(calculatePositionRatio(-10000, 100000)).toBe(-0.1)
  })
})

// ─── calculateHolding / getAllHoldings (require Tauri mock) ───────────────

describe('calculateHolding (with mocked Tauri)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when no trades exist for asset', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValue({
      assetId: 1,
      totalBuyQuantity: 0,
      totalSellQuantity: 0,
      currentQuantity: 0,
      avgCost: 0,
      remainingCost: 0,
      realizedPnl: 0,
      totalBuyAmount: 0,
      totalSellAmount: 0,
    })

    const { calculateHolding } = await import('./position-calculation.service')
    const result = await calculateHolding(1)
    expect(result).toBeNull()
  })

  it('should return holding info when trades exist', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    vi.mocked(invoke).mockResolvedValue({
      assetId: 1,
      totalBuyQuantity: 5000,
      totalSellQuantity: 0,
      currentQuantity: 5000,
      avgCost: 1500, // 1.50 yuan in fen
      remainingCost: 7500,
      realizedPnl: 0,
      totalBuyAmount: 7500,
      totalSellAmount: 0,
    })

    const { calculateHolding } = await import('./position-calculation.service')
    const result = await calculateHolding(1)

    expect(result).not.toBeNull()
    expect(result!.assetId).toBe(1)
    expect(result!.currentQuantity).toBe(5000)
    expect(result!.avgCost).toBe(1500)
  })
})