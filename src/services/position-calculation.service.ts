/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: position-calculation.service.ts 模块
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { Asset } from '@/domain/types'
import { getTradeSummaryByAsset } from './trade-query.service'
import { createServiceError } from '@/shared/utils/error'

export type HoldingInfo = {
  assetId: number
  assetCode: string
  assetName: string
  totalBuyQuantity: number
  totalSellQuantity: number
  currentQuantity: number
  avgCost: number
  totalBuyAmount: number
  totalSellAmount: number
  remainingCost: number
  realizedPnl: number
}

async function getAllAssets(): Promise<Asset[]> {
  try {
    return await invoke<Asset[]>('query_assets', {
      keyword: undefined,
      asset_type: undefined,
      market: undefined,
    })
  } catch (error) {
    throw createServiceError('获取资产列表失败', error)
  }
}

export async function calculateHolding(assetId: number): Promise<HoldingInfo | null> {
  const summary = await getTradeSummaryByAsset(assetId)

  if (!summary || summary.currentQuantity <= 0) {
    return null
  }

  return {
    assetId,
    assetCode: '',
    assetName: '',
    totalBuyQuantity: summary.totalBuyQuantity,
    totalSellQuantity: summary.totalSellQuantity,
    currentQuantity: summary.currentQuantity,
    avgCost: summary.avgCost,
    totalBuyAmount: summary.totalBuyAmount,
    totalSellAmount: summary.totalSellAmount,
    remainingCost: summary.remainingCost,
    realizedPnl: summary.realizedPnl,
  }
}

export async function getAllHoldings(): Promise<HoldingInfo[]> {
  const assets = await getAllAssets()

  const holdings = await Promise.all(
    assets.map(async (asset) => {
      const summary = await calculateHolding(asset.id)

      if (!summary) {
        return null
      }

      return {
        ...summary,
        assetCode: asset.code,
        assetName: asset.name,
      }
    }),
  )

  return holdings.filter((item): item is HoldingInfo => item !== null)
}

export function calculatePositionRatio(marketValue: number, totalAssets: number): number {
  if (totalAssets === 0) {
    return 0
  }

  return marketValue / totalAssets
}
