/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易复盘类型定义
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import type { IssueType, ReviewResult } from './constants'

/** 交易复盘 */
export type Review = {
  id: number
  tradeId: number
  result: ReviewResult
  issueType: IssueType | null
  summary: string
  improve: string | null
  createdAt: string
  updatedAt: string
  tradeAssetCode?: string | null
  tradeType?: string | null
  tradeCreatedAt?: string | null
}

/** 创建复盘载荷 */
export type ReviewCreatePayload = Omit<
  Review,
  'id' | 'createdAt' | 'updatedAt' | 'tradeAssetCode' | 'tradeType' | 'tradeCreatedAt'
>

/** 更新复盘载荷 */
export type ReviewUpdatePayload = Omit<
  Review,
  'createdAt' | 'updatedAt' | 'tradeAssetCode' | 'tradeType' | 'tradeCreatedAt'
>

/** 复盘过滤条件 */
export type ReviewFilter = {
  keyword?: string
  startDate?: string
  endDate?: string
  result?: ReviewResult | ''
  issueType?: IssueType | ''
}

/** 复盘结果标签映射 */
export const REVIEW_RESULT_LABELS: Record<ReviewResult, string> = {
  good: '好',
  bad: '差',
  neutral: '一般',
}

/** 问题类型标签映射 */
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  emotion: '情绪',
  rule: '规则',
  discipline: '纪律',
  external: '外部',
}
