# Pinia Store 生成模板

## 用途

生成 Pinia store，管理单个功能模块的状态、异步操作和数据持久化。

## 使用方式

1. 复制本模板内容
2. 在"具体需求"部分填入：
   - 状态字段（对应数据模型）
   - Actions 列表（CRUD 操作）
   - 异步处理逻辑
   - 目标文件路径和名称
3. 提交给 Codex

## 模板

### 系统提示
```
[使用 prompts/codex/system/system-prompt.txt]
```

### 任务描述

你需要生成一个 Pinia store，负责单个功能模块（如 assets, plans, trades）的状态管理和数据操作。

**Store 责任**：
- 管理模块状态（list, selectedItem, loading, error）
- 提供 async actions 进行 CRUD
- 调用 repository 层获取/保存数据
- 处理错误和加载状态
- 支持数据查询和过滤

**使用场景**：
在 Vue 组件中通过 `useXxxStore()` 调用，执行异步操作和状态更新。

### 具体需求

**状态字段**（示例）：
```ts
interface AssetsState {
  assets: Asset[]           // 资产列表
  selectedAsset: Asset | null
  loading: boolean
  error: string | null
  totalCount: number        // 分页用
  currentPage: number
}
```

**Actions**（示例）：
```ts
// 1. loadAssets()
//    - async 函数
//    - 调用 repository.getAssets()
//    - 更新 state.assets, state.loading, state.error
//    - 处理异常并设置 error

// 2. createAsset(data: AssetCreatePayload)
//    - 参数验证
//    - 调用 repository.createAsset(data)
//    - 成功：更新 state.assets 列表
//    - 失败：设置 error

// 3. updateAsset(data: Asset)
//    - 调用 repository.updateAsset(data)
//    - 成功：更新 state.assets 中对应项

// 4. deleteAsset(id: number)
//    - 调用 repository.deleteAsset(id)
//    - 成功：从 state.assets 移除

// ... 更多 actions
```

**数据模型依赖**：
- Repository 路径：`src/features/[feature]/repository.ts`
- 类型定义路径：`src/features/[feature]/types.ts`

**其他要求**：
- 目标路径：`src/features/[feature]/store.ts`
- Store 名称：use[Feature]Store（如 useAssetStore）
- 所有 async action 返回 Promise<void>
- 错误处理完整，不抛异常，只设置 state.error

### 输出格式

完整的 TypeScript Pinia store 代码，包括：
- interface State 定义
- defineStore 实现
- state() 初始化
- actions 实现
- getters（可选，如有必要）

## 核心特性

### State 标准结构
```ts
interface XxxState {
  items: Item[]
  selectedItem: Item | null
  loading: boolean
  error: string | null
  totalCount: number
  filters: FilterOptions
}
```

### Actions 标准模式
```ts
async loadItems() {
  this.loading = true
  this.error = null
  try {
    this.items = await repository.getItems()
  } catch (e) {
    this.error = (e as Error).message
  } finally {
    this.loading = false
  }
}
```

### 错误处理规范
- 所有异常捕获为 string 或 Error
- 设置 state.error 但**不抛异常**
- 调用方可通过 store.error 获取错误信息
- 所有 action 统一策略：catch 异常后存入 state.error，返回 void，不 re-throw

## 示例 Prompt 完整版

```markdown
## 生成资产管理 Store

基于以下需求生成 Pinia store：

**状态**：
- assets: Asset[] - 资产列表
- loading: boolean - 操作中状态
- error: string | null - 错误信息
- totalCount: number - 总记录数

**Actions**：
- loadAssets(): 从 repository 加载全部资产
- createAsset(payload: AssetCreatePayload): 创建新资产
- updateAsset(asset: Asset): 更新资产信息
- deleteAsset(id: number): 删除资产
- selectAsset(id: number): 选中资产
- clearError(): 清除错误信息

**Repository 函数**：
- getAssets(): Promise<Asset[]>
- createAsset(payload: AssetCreatePayload): Promise<Asset>
- updateAsset(asset: Asset): Promise<Asset>
- deleteAsset(id: number): Promise<void>

**目标路径**：src/features/assets/store.ts

**Store 名称**：useAssetStore

**特殊要求**：
- 所有 async action 返回 Promise<void>
- 错误设置在 state.error，不抛异常
- 支持多次快速调用，loading 状态保证准确
```

## 常见参数

| 参数 | 说明 | 示例 |
|------|------|------|
| 异步处理 | 加载状态管理 | loading/error 分离 |
| 错误处理 | 捕获与存储 | 不抛异常，存储在 state.error |
| 数据初始化 | state() 返回 | 深拷贝而非引用 |
| Getters | 衍生状态 | isLoading, hasError 等 |
| 持久化 | 状态保存 | 可选，调用 storage API |

## 高级模式（可选）

- **乐观更新**：先更新 UI，后异步请求
- **分页管理**：currentPage, pageSize, totalCount
- **搜索与过滤**：filterOptions, filteredItems getter
- **批量操作**：deleteMultiple, updateMultiple

## Store 风格约定

本项目统一使用 **Setup Store（Composition 风格）**，不使用 Options Store。

```ts
// ✅ 正确：Setup Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAssetStore = defineStore('assets', () => {
  // State
  const assets = ref<Asset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)

  // Getters
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const assetsByType = computed(() =>
    (type: string) => assets.value.filter(a => a.type === type)
  )

  // Actions
  async function loadAssets() {
    loading.value = true
    error.value = null
    try {
      assets.value = await repository.getAssets()
      totalCount.value = assets.value.length
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
      totalCount.value = assets.value.length
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

  async function deleteAsset(id: number) {
    loading.value = true
    error.value = null
    try {
      await repository.deleteAsset(id)
      assets.value = assets.value.filter(a => a.id !== id)
      totalCount.value = assets.value.length
    } catch (e) {
      error.value = (e as Error).message || '删除资产失败'
      console.error('deleteAsset error:', e)
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    assets, loading, error, totalCount,
    isLoading, hasError, assetsByType,
    loadAssets, createAsset, updateAsset, deleteAsset, clearError
  }
})
```
