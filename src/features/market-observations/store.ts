/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 市场观察 Pinia Store
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  MarketObservation,
  MarketObservationCreatePayload,
  MarketObservationFilter,
  MarketObservationUpdatePayload,
} from '@/domain/types'
import * as repository from './repository'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}

function normalizeFilters(filters: MarketObservationFilter): MarketObservationFilter {
  return {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sentiment: filters.sentiment || undefined,
  }
}

/**
 * Market Observations 模块状态管理。
 */
export const useMarketObservationStore = defineStore('marketObservations', () => {
  const observations = ref<MarketObservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<MarketObservationFilter>({ startDate: '', endDate: '', sentiment: '' })

  const totalCount = computed(() => observations.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /**
   * 加载所有观察记录。
   */
  async function loadObservations(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      observations.value = await repository.getMarketObservations()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载市场观察记录失败')
      console.error('loadObservations error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 按当前过滤条件搜索。
   */
  async function searchObservations(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      observations.value = await repository.queryMarketObservations(normalizeFilters(filters.value))
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '搜索市场观察记录失败')
      console.error('searchObservations error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建观察记录。
   */
  async function createObservation(payload: MarketObservationCreatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const newObservation = await repository.createMarketObservation(payload)
      observations.value.unshift(newObservation)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建市场观察记录失败')
      console.error('createObservation error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新观察记录。
   */
  async function updateObservation(payload: MarketObservationUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updated = await repository.updateMarketObservation(payload)
      const index = observations.value.findIndex((o) => o.id === updated.id)

      if (index >= 0) {
        observations.value[index] = updated
      }
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新市场观察记录失败')
      console.error('updateObservation error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除观察记录。
   */
  async function deleteObservation(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.deleteMarketObservation(id)
      observations.value = observations.value.filter((o) => o.id !== id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除市场观察记录失败')
      console.error('deleteObservation error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置过滤条件。
   */
  function setFilters(newFilters: Partial<MarketObservationFilter>): void {
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
    observations,
    loading,
    error,
    filters,
    totalCount,
    isLoading,
    hasError,
    loadObservations,
    searchObservations,
    createObservation,
    updateObservation,
    deleteObservation,
    setFilters,
    clearError,
  }
})
