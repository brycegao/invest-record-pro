/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易记录 Pinia Store
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Trade, TradeCreatePayload, TradeFilter, TradeUpdatePayload } from '@/domain/types'
import * as repository from './repository'
import { getErrorMessage } from '@/shared/utils/error'

function normalizeFilters(filters: TradeFilter): TradeFilter {
  return {
    keyword: filters.keyword?.trim() || undefined,
    tradeType: filters.tradeType || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    followPlan: filters.followPlan === '' ? undefined : filters.followPlan,
    mood: filters.mood || undefined,
  }
}

/**
 * Trades 模块状态管理。
 */
export const useTradeStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TradeFilter>({ keyword: '', tradeType: '', followPlan: '', mood: '' })

  const totalCount = computed(() => trades.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /**
   * 加载所有交易记录。
   */
  async function loadTrades(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      trades.value = await repository.getTrades()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载交易记录失败')
      console.error('loadTrades error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 按当前过滤条件搜索交易记录。
   */
  async function searchTrades(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      trades.value = await repository.queryTrades(normalizeFilters(filters.value))
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '搜索交易记录失败')
      console.error('searchTrades error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建交易记录。
   * @param payload 创建载荷
   */
  async function createTrade(payload: TradeCreatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.createTrade(payload)
      await loadTrades()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建交易记录失败')
      console.error('createTrade error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新交易记录。
   * @param payload 更新载荷
   */
  async function updateTrade(payload: TradeUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.updateTrade(payload)
      await loadTrades()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新交易记录失败')
      console.error('updateTrade error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除交易记录。
   * @param id 交易 ID
   */
  async function deleteTrade(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.deleteTrade(id)
      trades.value = trades.value.filter((trade) => trade.id !== id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除交易记录失败')
      console.error('deleteTrade error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置过滤条件。
   * @param newFilters 新过滤条件
   */
  function setFilters(newFilters: Partial<TradeFilter>): void {
    filters.value = {
      ...filters.value,
      ...newFilters,
    }
  }

  /**
   * 清除错误信息。
   */
  function clearError(): void {
    error.value = null
  }

  return {
    trades,
    loading,
    error,
    filters,
    totalCount,
    isLoading,
    hasError,
    loadTrades,
    searchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
    setFilters,
    clearError,
  }
})
