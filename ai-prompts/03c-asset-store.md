# Batch 3c：Assets 模块 — Pinia Store

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript
- Repository 已实现在 `src/features/assets/repository.ts`，提供：getAssets, createAsset, updateAsset, deleteAsset, queryAssets
- 类型定义在 `src/domain/types/asset.ts`：Asset, AssetCreatePayload, AssetUpdatePayload, AssetFilter

## 任务

生成 Assets 模块的 Pinia Store。

## 生成文件：`src/features/assets/store.ts`

### 要求

**必须使用 Setup Store（Composition 风格）**，不使用 Options Store。

### State

```ts
const assets = ref<Asset[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const filters = ref<AssetFilter>({ keyword: '', type: '', market: '' })
```

### Getters

```ts
const totalCount = computed(() => assets.value.length)
const isLoading = computed(() => loading.value)
const hasError = computed(() => !!error.value)
const assetsByType = (type: string) => computed(() => assets.value.filter(a => a.type === type))
```

### Actions

```ts
/**
 * 加载所有资产
 */
async function loadAssets(): Promise<void>

/**
 * 按条件搜索资产（设置 filters 后调用）
 */
async function searchAssets(): Promise<void>

/**
 * 创建新资产
 */
async function createAsset(payload: AssetCreatePayload): Promise<void>

/**
 * 更新资产信息
 */
async function updateAsset(asset: AssetUpdatePayload): Promise<void>

/**
 * 删除资产
 */
async function deleteAsset(id: number): Promise<void>

/**
 * 设置过滤条件
 */
function setFilters(newFilters: Partial<AssetFilter>): void

/**
 * 清除错误信息
 */
function clearError(): void
```

### Action 实现模式

```ts
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
```

`searchAssets` 的实现：调用 `repository.queryAssets(filters.value)`，结果赋值给 `assets.value`。参数中的 `type` 和 `market` 需要将空字符串转为 undefined 再传给 repository。

### Expose

```ts
return {
  // State
  assets, loading, error, filters,
  // Getters
  totalCount, isLoading, hasError, assetsByType,
  // Actions
  loadAssets, searchAssets, createAsset, updateAsset, deleteAsset, setFilters, clearError,
}
```

### 参考代码（示例 Store 风格）

以下是一个同风格的 Store 示例，请遵循此模式：

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, AssetCreatePayload } from './types'
import * as repository from './repository'

export const useAssetStore = defineStore('assets', () => {
  const assets = ref<Asset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalCount = computed(() => assets.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

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

  async function updateAsset(asset: Asset) {
    loading.value = true
    error.value = null
    try {
      const updated = await repository.updateAsset(asset)
      const index = assets.value.findIndex(a => a.id === updated.id)
      if (index >= 0) assets.value[index] = updated
    } catch (e) {
      error.value = (e as Error).message || '更新资产失败'
      console.error('updateAsset error:', e)
    } finally {
      loading.value = false
    }
  }

  async function deleteAsset(id: number) {
    loading.value = true
    error.value = null
    try {
      await repository.deleteAsset(id)
      assets.value = assets.value.filter(a => a.id !== id)
    } catch (e) {
      error.value = (e as Error).message || '删除资产失败'
      console.error('deleteAsset error:', e)
    } finally {
      loading.value = false
    }
  }

  function clearError() { error.value = null }

  return {
    assets, loading, error,
    totalCount, isLoading, hasError,
    loadAssets, createAsset, updateAsset, deleteAsset, clearError,
  }
})
```

请基于此风格，增加 `filters`、`searchAssets`、`setFilters`，并从 `@/domain/types` 导入类型。

## 代码风格

- 禁止 any 类型
- 所有 export 函数有 JSDoc 注释
- Store 名称：`useAssetStore`
- 错误存储在 `state.error`，不 re-throw
- 使用 `@/domain/types` 导入类型
- 使用 `./repository` 导入 repository（相对路径，同模块内允许）
