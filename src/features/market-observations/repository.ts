/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 市场观察 Tauri IPC 仓库
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type {
  MarketObservation,
  MarketObservationCreatePayload,
  MarketObservationFilter,
  MarketObservationUpdatePayload,
} from '@/domain/types'

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

function toCreateCommandPayload(payload: MarketObservationCreatePayload) {
  return {
    observe_at: payload.observeAt,
    shanghai_index: payload.shanghaiIndex,
    sse_50_index: payload.sse50Index,
    csi_300_index: payload.csi300Index,
    market_turnover: payload.marketTurnover,
    sentiment: payload.sentiment,
    policy_event: payload.policyEvent,
    macro_note: payload.macroNote,
    personal_view: payload.personalView,
  }
}

function toUpdateCommandPayload(payload: MarketObservationUpdatePayload) {
  return {
    id: payload.id,
    ...toCreateCommandPayload(payload),
  }
}

/**
 * 获取所有市场观察记录。
 * @returns 观察列表
 */
export async function getMarketObservations(): Promise<MarketObservation[]> {
  try {
    return await invoke<MarketObservation[]>('get_market_observations')
  } catch (error) {
    throw createRepositoryError('获取市场观察记录失败', error)
  }
}

/**
 * 创建市场观察记录。
 * @param payload 创建载荷
 * @returns 新创建的记录
 */
export async function createMarketObservation(
  payload: MarketObservationCreatePayload,
): Promise<MarketObservation> {
  try {
    return await invoke<MarketObservation>('create_market_observation', {
      payload: toCreateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建市场观察记录失败', error)
  }
}

/**
 * 更新市场观察记录。
 * @param payload 更新载荷
 * @returns 更新后的记录
 */
export async function updateMarketObservation(
  payload: MarketObservationUpdatePayload,
): Promise<MarketObservation> {
  try {
    return await invoke<MarketObservation>('update_market_observation', {
      payload: toUpdateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('更新市场观察记录失败', error)
  }
}

/**
 * 删除市场观察记录。
 * @param id 记录 ID
 */
export async function deleteMarketObservation(id: number): Promise<void> {
  try {
    await invoke<void>('delete_market_observation', { id })
  } catch (error) {
    throw createRepositoryError('删除市场观察记录失败', error)
  }
}

/**
 * 按条件查询市场观察记录。
 * @param filter 过滤条件
 * @returns 匹配的观察列表
 */
export async function queryMarketObservations(
  filter: MarketObservationFilter,
): Promise<MarketObservation[]> {
  try {
    return await invoke<MarketObservation[]>('query_market_observations', {
      start_date: filter.startDate,
      end_date: filter.endDate,
      sentiment: filter.sentiment,
    })
  } catch (error) {
    throw createRepositoryError('查询市场观察记录失败', error)
  }
}
