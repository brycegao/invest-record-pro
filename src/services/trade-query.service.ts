/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: trade-query.service.ts 模块
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { TradeSummary } from '@/domain/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '未知错误'
}

function createServiceError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}

export async function getTradeSummaryByAsset(assetId: number): Promise<TradeSummary> {
  try {
    return await invoke<TradeSummary>('get_trade_summary', { asset_id: assetId })
  } catch (error) {
    throw createServiceError('获取交易汇总失败', error)
  }
}
