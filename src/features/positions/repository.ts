import { invoke } from '@tauri-apps/api/core'
import type { Position, PositionCreatePayload, PositionItem } from '@/domain/types'

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '未知错误'
}

function createRepositoryError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
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
