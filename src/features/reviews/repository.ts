/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易复盘 Tauri IPC 仓库
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { Review, ReviewCreatePayload, ReviewFilter, ReviewUpdatePayload } from '@/domain/types'
import { createServiceError as createRepositoryError } from '@/shared/utils/error'

function toCreateCommandPayload(payload: ReviewCreatePayload) {
  return {
    trade_id: payload.tradeId,
    result: payload.result,
    issue_type: payload.issueType,
    summary: payload.summary,
    improve: payload.improve,
  }
}

function toUpdateCommandPayload(payload: ReviewUpdatePayload) {
  return {
    id: payload.id,
    ...toCreateCommandPayload(payload),
  }
}

/**
 * 获取所有复盘记录。
 * @returns 复盘列表
 */
export async function getReviews(): Promise<Review[]> {
  try {
    return await invoke<Review[]>('get_reviews')
  } catch (error) {
    throw createRepositoryError('获取复盘记录失败', error)
  }
}

/**
 * 创建复盘记录。
 * @param payload 创建载荷
 * @returns 新创建的复盘记录
 */
export async function createReview(payload: ReviewCreatePayload): Promise<Review> {
  try {
    return await invoke<Review>('create_review', {
      payload: toCreateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建复盘记录失败', error)
  }
}

/**
 * 更新复盘记录。
 * @param payload 更新载荷
 * @returns 更新后的复盘记录
 */
export async function updateReview(payload: ReviewUpdatePayload): Promise<Review> {
  try {
    return await invoke<Review>('update_review', {
      payload: toUpdateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('更新复盘记录失败', error)
  }
}

/**
 * 删除复盘记录。
 * @param id 复盘记录 ID
 */
export async function deleteReview(id: number): Promise<void> {
  try {
    await invoke<void>('delete_review', { id })
  } catch (error) {
    throw createRepositoryError('删除复盘记录失败', error)
  }
}

/**
 * 按条件查询复盘记录。
 * @param filter 过滤条件
 * @returns 匹配的复盘列表
 */
export async function queryReviews(filter: ReviewFilter): Promise<Review[]> {
  try {
    return await invoke<Review[]>('query_reviews', {
      keyword: filter.keyword,
      start_date: filter.startDate,
      end_date: filter.endDate,
      result: filter.result,
      issue_type: filter.issueType,
    })
  } catch (error) {
    throw createRepositoryError('查询复盘记录失败', error)
  }
}
