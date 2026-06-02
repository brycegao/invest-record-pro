import { invoke } from '@tauri-apps/api/core'
import type {
  Trade,
  TradeCreatePayload,
  TradeFilter,
  TradeSummary,
  TradeUpdatePayload,
} from '@/domain/types'

type TradeCommandPayload = {
  asset_id: number
  plan_id: number | null
  trade_at: string
  trade_type: Trade['tradeType']
  quantity: number
  price: number
  total_amount: number
  fee: number
  index_point: number | null
  reason: string | null
  follow_plan: boolean
  mood: Trade['mood']
  notes: string | null
}

type TradeUpdateCommandPayload = TradeCommandPayload & {
  id: number
}

function toTradeCommandPayload(payload: TradeCreatePayload): TradeCommandPayload {
  return {
    asset_id: payload.assetId,
    plan_id: payload.planId,
    trade_at: payload.tradeAt,
    trade_type: payload.tradeType,
    quantity: payload.quantity,
    price: payload.price,
    total_amount: payload.totalAmount,
    fee: payload.fee,
    index_point: payload.indexPoint,
    reason: payload.reason,
    follow_plan: payload.followPlan,
    mood: payload.mood,
    notes: payload.notes,
  }
}

function toTradeUpdateCommandPayload(payload: TradeUpdatePayload): TradeUpdateCommandPayload {
  return {
    id: payload.id,
    ...toTradeCommandPayload(payload),
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

/**
 * 获取所有交易记录。
 * @returns 交易记录列表
 */
export async function getTrades(): Promise<Trade[]> {
  try {
    return await invoke<Trade[]>('get_trades')
  } catch (error) {
    throw createRepositoryError('获取交易记录失败', error)
  }
}

/**
 * 创建交易记录。
 * @param payload 创建载荷
 * @returns 新创建的交易记录
 */
export async function createTrade(payload: TradeCreatePayload): Promise<Trade> {
  try {
    return await invoke<Trade>('create_trade', {
      payload: toTradeCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建交易记录失败', error)
  }
}

/**
 * 更新交易记录。
 * @param payload 更新载荷
 * @returns 更新后的交易记录
 */
export async function updateTrade(payload: TradeUpdatePayload): Promise<Trade> {
  try {
    return await invoke<Trade>('update_trade', {
      payload: toTradeUpdateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('更新交易记录失败', error)
  }
}

/**
 * 删除交易记录。
 * @param id 交易 ID
 */
export async function deleteTrade(id: number): Promise<void> {
  try {
    await invoke<void>('delete_trade', { id })
  } catch (error) {
    throw createRepositoryError('删除交易记录失败', error)
  }
}

/**
 * 按条件查询交易记录。
 * @param filter 过滤条件
 * @returns 匹配的交易记录列表
 */
export async function queryTrades(filter: TradeFilter): Promise<Trade[]> {
  try {
    return await invoke<Trade[]>('query_trades', {
      keyword: filter.keyword,
      trade_type: filter.tradeType,
      start_date: filter.startDate,
      end_date: filter.endDate,
      follow_plan: filter.followPlan === '' ? undefined : filter.followPlan,
      mood: filter.mood,
    })
  } catch (error) {
    throw createRepositoryError('查询交易记录失败', error)
  }
}

/**
 * 获取指定标的交易汇总。
 * @param assetId 标的 ID
 * @returns 交易汇总
 */
export async function getTradeSummary(assetId: number): Promise<TradeSummary> {
  try {
    return await invoke<TradeSummary>('get_trade_summary', { asset_id: assetId })
  } catch (error) {
    throw createRepositoryError('获取交易汇总失败', error)
  }
}
