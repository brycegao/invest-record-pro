/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 市场观察类型定义
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import type { Sentiment } from './constants'

/** 市场观察 */
export type MarketObservation = {
  id: number
  observeAt: string
  shanghaiIndex: number | null
  sse50Index: number | null
  csi300Index: number | null
  marketTurnover: number | null
  sentiment: Sentiment | null
  policyEvent: string | null
  macroNote: string | null
  personalView: string | null
  createdAt: string
  updatedAt: string
}

/** 创建市场观察载荷 */
export type MarketObservationCreatePayload = Omit<
  MarketObservation,
  'id' | 'createdAt' | 'updatedAt'
>

/** 更新市场观察载荷 */
export type MarketObservationUpdatePayload = Omit<MarketObservation, 'createdAt' | 'updatedAt'>

/** 过滤条件 */
export type MarketObservationFilter = {
  startDate?: string
  endDate?: string
  sentiment?: Sentiment | ''
}

/** 情绪标签映射 */
export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  极低: '极低',
  低: '低',
  中: '中',
  高: '高',
  极高: '极高',
}
