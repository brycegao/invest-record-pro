/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 仓位快照 Tauri IPC 仓库
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { Position, PositionCreatePayload, PositionItem } from '@/domain/types'
import { createServiceError as createRepositoryError } from '@/shared/utils/error'

type PositionItemCommandPayload = {
  asset_id: number
  quantity: number
  avg_cost: number
  current_price: number
  market_value: number
  unrealized_pnl: number
}

type PositionCreateCommandPayload = {
  snapshot_at: string
  cash: number
  total_assets: number
  unrealized_pnl: number
  realized_pnl: number
  items: PositionItemCommandPayload[]
}

function toPositionCommandPayload(payload: PositionCreatePayload): PositionCreateCommandPayload {
  return {
    snapshot_at: payload.snapshotAt,
    cash: payload.cash,
    total_assets: payload.totalAssets,
    unrealized_pnl: payload.unrealizedPnl,
    realized_pnl: payload.realizedPnl,
    items: payload.items.map((item) => ({
      asset_id: item.assetId,
      quantity: item.quantity,
      avg_cost: item.avgCost,
      current_price: item.currentPrice,
      market_value: item.marketValue,
      unrealized_pnl: item.unrealizedPnl,
    })),
  }
}

export async function getPositions(): Promise<Position[]> {
  try {
    return await invoke<Position[]>('get_positions')
  } catch (error) {
    throw createRepositoryError('获取仓位快照失败', error)
  }
}

export async function createPositionSnapshot(payload: PositionCreatePayload): Promise<Position> {
  try {
    return await invoke<Position>('create_position_snapshot', {
      payload: toPositionCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建仓位快照失败', error)
  }
}

export async function getPositionItems(positionId: number): Promise<PositionItem[]> {
  try {
    return await invoke<PositionItem[]>('get_position_items', { position_id: positionId })
  } catch (error) {
    throw createRepositoryError('获取仓位明细失败', error)
  }
}

export async function deletePosition(id: number): Promise<void> {
  try {
    await invoke<void>('delete_position', { id })
  } catch (error) {
    throw createRepositoryError('删除仓位快照失败', error)
  }
}

export async function getLatestPosition(): Promise<Position | null> {
  try {
    return await invoke<Position | null>('get_latest_position')
  } catch (error) {
    throw createRepositoryError('获取最新仓位失败', error)
  }
}
