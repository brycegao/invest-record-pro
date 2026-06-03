/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 投资标的 Pinia Store
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, AssetCreatePayload, AssetFilter, AssetUpdatePayload } from '@/domain/types'
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

function normalizeFilters(filters: AssetFilter): AssetFilter {
  return {
    keyword: filters.keyword?.trim() || undefined,
    type: filters.type || undefined,
    market: filters.market || undefined,
  }
}

/**
 * Assets 模块状态管理。
 */
export const useAssetStore = defineStore('assets', () => {
  const assets = ref<Asset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<AssetFilter>({ keyword: '', type: '', market: '' })

  const totalCount = computed(() => assets.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const assetsByType = (type: string) =>
    computed(() => assets.value.filter((asset) => asset.type === type))

  /**
   * 加载所有资产。
   */
  async function loadAssets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      assets.value = await repository.getAssets()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载资产失败')
      console.error('loadAssets error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 按当前过滤条件搜索资产。
   */
  async function searchAssets(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      assets.value = await repository.queryAssets(normalizeFilters(filters.value))
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '搜索资产失败')
      console.error('searchAssets error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建新资产。
   * @param payload 创建载荷
   */
  async function createAsset(payload: AssetCreatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const newAsset = await repository.createAsset(payload)
      assets.value.unshift(newAsset)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建资产失败')
      console.error('createAsset error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新资产信息。
   * @param asset 资产更新载荷
   */
  async function updateAsset(asset: AssetUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedAsset = await repository.updateAsset(asset)
      const index = assets.value.findIndex((currentAsset) => currentAsset.id === updatedAsset.id)

      if (index >= 0) {
        assets.value[index] = updatedAsset
      }
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新资产失败')
      console.error('updateAsset error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除资产。
   * @param id 资产 ID
   */
  async function deleteAsset(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.deleteAsset(id)
      assets.value = assets.value.filter((asset) => asset.id !== id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除资产失败')
      console.error('deleteAsset error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置过滤条件。
   * @param newFilters 新过滤条件
   */
  function setFilters(newFilters: Partial<AssetFilter>): void {
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
    assets,
    loading,
    error,
    filters,
    totalCount,
    isLoading,
    hasError,
    assetsByType,
    loadAssets,
    searchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    setFilters,
    clearError,
  }
})
