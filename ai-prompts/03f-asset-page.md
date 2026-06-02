# Batch 3f：Assets 模块 — 页面组件 AssetsPage

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 以下组件已生成：
  - `src/features/assets/components/AssetTable.vue` — 表格组件，Props: `data, loading`，Emits: `edit, delete`
  - `src/features/assets/components/AssetForm.vue` — 表单 Drawer，Props: `visible, asset, loading`，Emits: `update:visible, submit`
- Store 已生成：`src/features/assets/store.ts` — useAssetStore，提供 loadAssets, createAsset, updateAsset, deleteAsset, searchAssets, setFilters, clearError
- 类型定义：`src/domain/types/` — Asset, AssetCreatePayload, AssetFilter, ASSET_TYPES, MARKETS, ASSET_TYPE_LABELS, MARKET_LABELS

## 任务

生成 Assets 模块的页面组件，替换已有的占位组件。

## 生成文件：`src/pages/assets/AssetsPage.vue`

### 页面结构

```
┌─────────────────────────────────────────────┐
│ 投资标的                                     │
│ 管理你关注和持有的投资标的                    │
│                                             │
│ [+ 新增标的]  [导出]                          │
│                                             │
│ 代码/名称 [___]  类型 [___]  市场 [___]       │
│ [搜索]  [重置]                               │
│                                             │
│ ┌─────────────────────────────────────────┐  │
│ │ AssetTable                              │  │
│ │                                         │  │
│ └─────────────────────────────────────────┘  │
│                                             │
│ AssetForm (Drawer)                          │
└─────────────────────────────────────────────┘
```

### 功能要求

1. **页面标题区**
   - 标题：`<h2>投资标的</h2>`
   - 描述：`<p class="text-gray-500">管理你关注和持有的投资标的</p>`

2. **操作按钮行**
   - `[+ 新增标的]` — type="primary"，点击打开空表单 Drawer
   - `[导出]` — v1 占位按钮（disabled，显示 tooltip "功能开发中"），后续批次实现

3. **筛选区**
   - `代码/名称` — n-input，placeholder="搜索代码或名称"
   - `类型` — n-select，选项：全部 / 股票 / ETF / 基金 / 指数 / 债券（"全部"的 value 为空字符串）
   - `市场` — n-select，选项：全部 / CN / HK / US
   - `[搜索]` — type="primary"，点击后设置 filters 并调用 searchAssets
   - `[重置]` — 点击后清空所有筛选条件并调用 loadAssets

4. **表格区域**
   - 使用 AssetTable 组件
   - data 绑定 store.assets
   - loading 绑定 store.loading

5. **表单 Drawer**
   - 使用 AssetForm 组件
   - visible 绑定 formVisible ref
   - asset 绑定 selectedAsset ref
   - loading 绑定 store.loading
   - submit 事件：根据 selectedAsset 判断是新建还是更新，调用对应 store action
   - 提交成功后：关闭 Drawer，显示成功 toast，刷新列表

6. **删除操作**
   - AssetTable emit delete 后，调用 store.deleteAsset(row.id)
   - 成功后显示成功 toast，列表自动更新

7. **生命周期**
   - `onMounted` 调用 `store.loadAssets()`

### 实现模式

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useAssetStore } from '@/features/assets/store'
import { AssetTable } from '@/features/assets/components'
import { AssetForm } from '@/features/assets/components'
import type { Asset, AssetCreatePayload, AssetFilter } from '@/domain/types'
import { ASSET_TYPE_LABELS, MARKET_LABELS } from '@/domain/types'

const message = useMessage()
const store = useAssetStore()

const formVisible = ref(false)
const selectedAsset = ref<Asset | null>(null)

// 筛选条件
const filterKeyword = ref('')
const filterType = ref('')
const filterMarket = ref('')

// 筛选选项
import type { AssetType, Market } from '@/domain/types'
import { ASSET_TYPES, MARKETS } from '@/domain/types'

const typeOptions = [
  { label: '全部', value: '' },
  ...ASSET_TYPES.map((t) => ({ label: ASSET_TYPE_LABELS[t], value: t })),
]
const marketOptions = [
  { label: '全部', value: '' },
  ...MARKETS.map((m) => ({ label: MARKET_LABELS[m], value: m })),
]

onMounted(() => {
  store.loadAssets()
})

function handleCreate() {
  selectedAsset.value = null
  formVisible.value = true
}

function handleEdit(row: Asset) {
  selectedAsset.value = row
  formVisible.value = true
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error) {
    return error
  }
  return '操作失败'
}

async function handleDelete(row: Asset) {
  try {
    await store.deleteAsset(row.id)
    message.success('删除成功')
  } catch (e) {
    message.error(getErrorMessage(e))
  }
}

async function handleFormSubmit(data: AssetCreatePayload) {
  try {
    if (selectedAsset.value) {
      await store.updateAsset({ ...data, id: selectedAsset.value.id })
      message.success('更新成功')
    } else {
      await store.createAsset(data)
      message.success('创建成功')
    }
    formVisible.value = false
  } catch (e) {
    message.error(getErrorMessage(e))
  }
}

function handleSearch() {
  store.setFilters({
    keyword: filterKeyword.value || undefined,
    type: (filterType.value || undefined) as AssetFilter['type'],
    market: (filterMarket.value || undefined) as AssetFilter['market'],
  })
  store.searchAssets()
}

function handleReset() {
  filterKeyword.value = ''
  filterType.value = ''
  filterMarket.value = ''
  store.setFilters({})
  store.loadAssets()
}
</script>
```

### Template 结构

```vue
<template>
  <n-card>
    <!-- 标题区 -->
    <div style="margin-bottom: 16px">
      <h2 style="font-size: 18px; font-weight: 600">投资标的</h2>
      <p style="font-size: 14px; color: #6b7280; margin-top: 4px">管理你关注和持有的投资标的</p>
    </div>

    <!-- 操作按钮 -->
    <n-space style="margin-bottom: 16px">
      <n-button type="primary" @click="handleCreate">+ 新增标的</n-button>
      <n-button disabled>导出</n-button>
    </n-space>

    <!-- 筛选区 -->
    <n-space align="end" style="margin-bottom: 16px">
      <n-input
        v-model:value="filterKeyword"
        placeholder="搜索代码或名称"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      />
      <n-select
        v-model:value="filterType"
        :options="typeOptions"
        placeholder="类型"
        style="width: 120px"
        clearable
      />
      <n-select
        v-model:value="filterMarket"
        :options="marketOptions"
        placeholder="市场"
        style="width: 120px"
        clearable
      />
      <n-button type="primary" @click="handleSearch">搜索</n-button>
      <n-button @click="handleReset">重置</n-button>
    </n-space>

    <!-- 表格 -->
    <AssetTable
      :data="store.assets"
      :loading="store.isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- 表单 Drawer -->
    <AssetForm
      :visible="formVisible"
      :asset="selectedAsset"
      :loading="store.isLoading"
      @update:visible="formVisible = $event"
      @submit="handleFormSubmit"
    />
  </n-card>
</template>
```

### 组件导入

从 `@/features/assets/components` 导入，使用 index.ts 桶导出：
- `AssetTable`
- `AssetForm`

确保 `src/features/assets/components/index.ts` 存在并导出这两个组件。

## 代码风格

- `<script setup lang="ts">`
- CSS `scoped`，使用 Naive UI 组件自带样式
- 使用 `@/` 路径别名
- 禁止 any 类型
