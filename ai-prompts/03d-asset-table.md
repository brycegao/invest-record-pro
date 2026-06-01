# Batch 3d：Assets 模块 — 表格组件 AssetTable

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义在 `src/domain/types/`：Asset, ASSET_TYPES, MARKETS, ASSET_TYPE_LABELS, MARKET_LABELS 等
- 金融工具函数在 `src/domain/types/financial.ts`
- 日期格式化建议使用 dayjs

## 任务

生成 Assets 模块的表格组件。

## 生成文件：`src/features/assets/components/AssetTable.vue`

### 组件功能

展示资产列表数据表格，支持排序、分页、操作列。

### Props

```ts
interface Props {
  data: Asset[]
  loading: boolean
}
```

### Emits

```ts
interface Emits {
  (e: 'edit', row: Asset): void
  (e: 'delete', row: Asset): void
}
```

### 表格列定义

| 列 | 字段 | 对齐 | 排序 | 宽度 |
|----|------|------|------|------|
| 代码 | code | left | ✓ | 100 |
| 名称 | name | left | ✓ | 150 |
| 类型 | type (tag) | center | ✓ | 80 |
| 市场 | market (tag) | center | ✓ | 80 |
| 风险等级 | riskLevel | center | ✓ | 90 |
| 创建时间 | createdAt | left | ✓ | 170 |
| 操作 | — | center | — | 120 |

### 类型 tag 配色（n-tag）

```ts
const typeTagColor: Record<AssetType, 'default' | 'success' | 'info' | 'warning'> = {
  stock: 'default',
  etf: 'success',
  fund: 'info',
  index: 'warning',
  bond: 'default',
}
```

### 市场 tag

使用 `MARKET_LABELS` 映射显示中文，统一 default 颜色。

### 风险等级显示

使用 `n-rate`（只读，`readonly`）或直接显示数字 + `/5`。建议用 `n-rate` 更直观。

### 创建时间列

使用 dayjs 格式化为 `YYYY-MM-DD HH:mm`。

### 操作列

两个按钮：`[编辑]` + `[删除]`
- 编辑：`emit('edit', row)`
- 删除：使用 `n-popconfirm` 确认，确认文字："确认删除该资产吗？删除后关联的计划和交易记录也将被删除。"
- 确认后：`emit('delete', row)`

### 表格配置

- `size="small"`
- `stripe`
- `bordered="false"`
- `:loading="loading"` — loading 时显示骨架屏
- 默认排序：`default-sort-order="descend"` on createdAt
- 分页：`:pagination="{ pageSize: 20 }"`
- 空状态：使用 `n-empty`，描述"暂无投资标的"

### 代码结构

```vue
<template>
  <n-data-table
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="{ pageSize: 20 }"
    size="small"
    striped
    :default-sort="{ key: 'createdAt', order: 'descend' }"
  />
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, NButton, NSpace, NPopconfirm, NRate, NEmpty } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import type { Asset, AssetType } from '@/domain/types'
import { ASSET_TYPE_LABELS, MARKET_LABELS } from '@/domain/types'

const props = defineProps<{ ... }>()
const emit = defineEmits<{ ... }>()

const columns: DataTableColumns<Asset> = [
  // ... 列定义使用 render 函数
]
</script>
```

## 代码风格

- `<script setup lang="ts">`
- 使用 Naive UI 的 `h()` 渲染函数定义列 render
- 使用 `@/domain/types` 导入
- CSS `scoped`
- 禁止 any 类型
