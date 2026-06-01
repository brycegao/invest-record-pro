# Vue 页面组装模板

## 用途

生成完整的 Vue 页面组件，组装表单、表格、和业务逻辑。

## 模板

```markdown
## 需求

生成 Vue 3 页面组件：`src/features/{feature}/pages/{FeaturePage}.vue`

**功能**：
- 管理 {Feature} 的 CRUD 操作（列表、创建、编辑、删除）
- 集成 {FormComponent} 表单组件和 {TableComponent} 表格组件
- 调用 use{Feature}Store() 进行状态管理
- 支持搜索、排序、分页

**要求**：
1. 使用 Composition API（`<script setup>`）
2. 使用 Naive UI 布局（NLayout, NButton, NSpace）
3. 集成表单和表格组件
4. 错误处理和加载状态
5. 分页逻辑
6. 搜索/过滤逻辑

**参考**：
- Form: src/features/{feature}/components/{FormComponent}.vue
- Table: src/features/{feature}/components/{TableComponent}.vue
- Store: src/features/{feature}/store.ts

**输出**：完整的 .vue 文件，可直接使用
```

## 关键要点

### 页面结构

```
<template>
  <n-layout>
    <!-- 顶部：标题 + 新建按钮 -->
    <n-space>
      <h1>{{ pageTitle }}</h1>
      <n-button @click="handleCreate">新建</n-button>
    </n-space>

    <!-- 搜索 / 过滤栏 -->
    <n-input v-model:value="searchQuery" placeholder="搜索..." />

    <!-- 表格 -->
    <n-data-table :columns="columns" :data="filteredData" />

    <!-- 分页 -->
    <n-pagination v-model:page="currentPage" :page-count="pageCount" />

    <!-- 表单抽屉 -->
    <{FormComponent}
      v-model:visible="isFormOpen"
      :asset="selectedItem"
      @submit="handleFormSubmit"
    />
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use{Feature}Store } from '../store'
import { {FormComponent} } from '../components'

// State
const store = use{Feature}Store()
const isFormOpen = ref(false)
const selectedItem = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10

// Computed
const filteredData = computed(() => {
  return store.allItems.filter(item =>
    item.name.includes(searchQuery.value)
  )
})

const pageCount = computed(() =>
  Math.ceil(filteredData.value.length / pageSize)
)

// Methods
function handleCreate() {
  selectedItem.value = null
  isFormOpen.value = true
}

async function handleFormSubmit(data) {
  if (selectedItem.value) {
    await store.updateItem(data)
  } else {
    await store.createItem(data)
  }
  isFormOpen.value = false
}

// Lifecycle
onMounted(() => {
  store.loadItems()
})
</script>
```

### 数据表格集成

- 从 Store 获取数据
- 支持动态列定义（从类型推导）
- 集成操作列（编辑、删除）
- 加载和错误状态

### 搜索和过滤

- 实时搜索（debounce）
- 支持多字段搜索
- 清除搜索按钮

### 分页

- 基于过滤结果分页
- 保存当前页码
- 分页改变时重置搜索

### 表单集成

- 创建新项目：`selectedItem = null`
- 编辑现有项：`selectedItem = item`
- 表单 Drawer 组件
- 表单提交后关闭并刷新列表

## 示例需求

```
需求

生成 Vue 3 页面组件：`src/features/assets/pages/AssetsPage.vue`

**功能**：
- 管理资产的 CRUD 操作
- 集成 AssetForm 表单和 AssetTable 表格
- 调用 useAssetStore() 进行状态管理
- 支持搜索资产代码和名称
- 支持按类型、市场、风险等级过滤

**需求**：
1. 顶部：标题、新建资产按钮
2. 搜索栏：搜索资产代码和名称
3. 过滤栏：按类型、市场、风险过滤
4. 表格：显示资产列表，包括操作列（编辑、删除）
5. 分页：每页 20 条记录
6. 加载状态：isLoading 显示骨架屏
7. 错误处理：显示错误提示

**使用的组件**：
- AssetForm.vue：资产表单组件
- AssetTable.vue：资产表格组件

**使用的 Store**：
- useAssetStore()：资产状态管理

**输出**：完整的 AssetsPage.vue 文件
```

## 参数替换

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{Feature}` | 功能模块名（首字母大写） | Asset, Plan, Trade |
| `{feature}` | 功能模块名（小写）| asset, plan, trade |
| `{FeaturePage}` | 页面组件名 | AssetPage, PlanPage |
| `{FormComponent}` | 表单组件名 | AssetForm, PlanForm |
| `{TableComponent}` | 表格组件名 | AssetTable, PlanTable |

## 注意事项

- **不要手动绑定事件**：使用 `@click="handleMethod"` 而不是内联箭头函数
- **使用 Store 的 actions**：不要直接修改 State，通过 Action 修改
- **处理异步状态**：Loading、Error 都从 Store 获取
- **表单交互**：使用 Drawer/Modal 展示，提交时调用 Store action
- **分页和搜索**：分页改变时保留搜索条件，搜索改变时重置分页

## 常见问题

**Q: 如何处理多个搜索字段？**

A: 在 `computed` 中使用多条件过滤：

```typescript
const filteredData = computed(() =>
  store.allItems.filter(item =>
    (item.code.includes(searchQuery.value) ||
     item.name.includes(searchQuery.value)) &&
    (!selectedType.value || item.type === selectedType.value)
  )
)
```

**Q: 如何实现删除时的确认对话框？**

A: 使用 `n-popconfirm` 或 `useDialog()`：

```typescript
function handleDelete(item) {
  dialog.warning({
    title: '确认删除',
    content: `确定删除 ${item.name} 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await store.deleteItem(item.id)
    }
  })
}
```

**Q: 如何处理表格的排序？**

A: 使用 `n-data-table` 的 `sorter` 属性：

```typescript
const columns = [
  {
    title: '资产名称',
    key: 'name',
    sorter: (row1, row2) => row1.name.localeCompare(row2.name)
  }
]
```
