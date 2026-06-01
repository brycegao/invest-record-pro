import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, AssetCreatePayload } from './types'
import * as repository from './repository'

/**
 * 资产管理 Store (Composition API 风格)
 * 管理资产列表的状态和所有 CRUD 操作
 */
export const useAssetStore = defineStore('assets', () => {
  // ============== State ==============
  const assets = ref<Asset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============== Computed ==============
  /** 是否正在加载 */
  const isLoading = computed(() => loading.value)

  /** 是否有错误 */
  const hasError = computed(() => !!error.value)

  /** 获取所有资产 */
  const allAssets = computed(() => assets.value)

  /** 资产总数 */
  const totalCount = computed(() => assets.value.length)

  /** 按类型筛选资产 */
  const assetsByType = (type: string) => {
    return computed(() => assets.value.filter((a) => a.type === type))
  }

  // ============== Actions ==============
  /**
   * 加载所有资产
   */
  async function loadAssets() {
    loading.value = true
    error.value = null
    try {
      assets.value = await repository.getAssets()
    } catch (e) {
      error.value = (e as Error).message || '加载资产失败'
      console.error('loadAssets error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建新资产
   */
  async function createAsset(payload: AssetCreatePayload) {
    loading.value = true
    error.value = null
    try {
      const newAsset = await repository.createAsset(payload)
      assets.value.push(newAsset)
    } catch (e) {
      error.value = (e as Error).message || '创建资产失败'
      console.error('createAsset error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新资产信息
   */
  async function updateAsset(asset: Asset) {
    loading.value = true
    error.value = null
    try {
      const updated = await repository.updateAsset(asset)
      const index = assets.value.findIndex((a) => a.id === updated.id)
      if (index >= 0) {
        assets.value[index] = updated
      }
    } catch (e) {
      error.value = (e as Error).message || '更新资产失败'
      console.error('updateAsset error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除资产
   */
  async function deleteAsset(id: number) {
    loading.value = true
    error.value = null
    try {
      await repository.deleteAsset(id)
      assets.value = assets.value.filter((a) => a.id !== id)
    } catch (e) {
      error.value = (e as Error).message || '删除资产失败'
      console.error('deleteAsset error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null
  }

  // ============== Expose ==============
  return {
    // State
    assets,
    loading,
    error,
    // Computed
    isLoading,
    hasError,
    allAssets,
    totalCount,
    assetsByType,
    // Actions
    loadAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    clearError
  }
})
