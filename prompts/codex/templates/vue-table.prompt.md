# Vue 3 表格组件生成模板

## 用途

生成基于 Naive UI 的 Vue 3 数据表格组件，支持列表展示、分页、操作列（编辑/删除）。

## 使用方式

1. 复制本模板内容
2. 在"具体需求"部分填入：
   - 列定义（字段名、类型、格式）
   - 数据来源（Store/Repository）
   - 操作功能（编辑、删除、导出等）
   - 目标路径和文件名
3. 提交给 Codex

## 模板

### 系统提示
```
[使用 prompts/codex/system/system-prompt.txt]
```

### 任务描述

你需要生成一个 Vue 3 数据表格组件。

**组件功能**：
- 展示数据列表，支持分页
- 操作列（编辑、删除、导出等）
- 删除前确认
- 加载状态与异常提示
- 虚拟滚动（如数据超过 500 条）

**使用场景**：
在页面中作为列表展示，可关联 Modal/Drawer 进行编辑操作。

### 具体需求

**表格列定义**（示例）：
```ts
// 列 1: id
// - 类型：number
// - 宽度：60px
// - 说明：唯一标识，不展示

// 列 2: code
// - 类型：string
// - 宽度：100px
// - 排序：否
// - 说明：资产代码

// 列 3: name
// - 类型：string
// - 宽度：150px
// - 说明：资产名称

// 列 4: type
// - 类型：enum
// - 值：['ETF', '股票', '债券']
// - 宽度：80px

// ... 更多列

// 操作列
// - 宽度：150px
// - 操作：编辑、删除
```

**数据类型**：
```ts
interface RowData {
  // 对应 Asset / Plan / Trade 等模型
}
```

**行操作**：
```ts
// 编辑：emit('edit', row) 或打开 modal
// 删除：显示确认对话框，确认后调用 async 函数 onDelete(row.id)
```

**分页**：
- 每页显示数：20 条
- 分页位置：表格下方

**其他要求**：
- 目标路径：`src/features/[feature]/components/[FeatureName]Table.vue`
- 列表为空时显示提示信息
- 表格 striped（条纹）
- 边框样式：default
- 最后一列为操作列

### 输出格式

完整的 Vue 3 组件代码，包括：
- `<template>` - Naive UI NDataTable、NButton、NPopconfirm
- `<script setup>` - TypeScript
- `<style scoped>` - CSS

## 核心特性

### Props
```ts
const props = defineProps<{
  data: RowData[]           // NDataTable 的 data prop，传入原始数据数组
  loading: boolean          // 加载中状态
  totalCount?: number       // 总记录数（分页用）
}>()
```

### Emits
```ts
emits('edit', (row: RowData) => {})
emits('delete', (row: RowData) => Promise<void>)
```

### 内部实现
- 列定义集中在 columns 变量
- 删除操作前弹出确认框
- 分页跳转时触发数据重新加载
- 加载中时表格按钮禁用

## 示例 Prompt 完整版

```markdown
## 生成资产列表表格组件

基于以下需求生成 Vue 3 表格组件：

**表格列**：
- code (string, 100px): 资产代码
- name (string, 150px): 资产名称
- type (string, 80px): 资产类型
- market (string, 80px): 交易市场
- riskLevel (string, 100px): 风险等级
- createdAt (date, 150px, 格式化为 YYYY-MM-DD): 创建时间
- 操作列 (150px): 编辑、删除按钮

**数据来源**：from Pinia store useAssetStore()

**操作**：
- 编辑：点击编辑按钮，emit('edit', row) 通知父组件
- 删除：点击删除，弹出确认对话框，确认后调用 onDelete(row.id) async 函数

**分页**：
- 每页 20 条
- 总数来自 store 的 totalCount

**目标路径**：src/features/assets/components/AssetTable.vue

**特殊要求**：
- 表格为空时显示"暂无数据"
- 删除成功后自动刷新表格
- 表格有 loading 状态时，所有操作按钮禁用
```

## 常见参数

| 参数 | 说明 | 示例 |
|------|------|------|
| 分页大小 | 每页条数 | 20 |
| 分页显示 | 位置 | 表格下方 |
| 日期格式 | 时间显示 | YYYY-MM-DD HH:mm |
| 删除确认 | 提示文字 | "确认删除该项吗?" |
| 空状态 | 无数据提示 | "暂无数据" |
| 操作列宽 | 操作按钮所需宽度 | 120-150px |

## 高级特性（可选）

- **虚拟滚动**：数据超过 500 条时启用，需同时设置 `virtual-scroll` 和 `max-height` 属性
  ```vue
  <n-data-table
    :data="data"
    :columns="columns"
    :virtual-scroll="data.length > 500"
    :max-height="600"
  />
  ```
- **多选**：使用 NDataTable 的 checkbox
- **导出**：行末添加"导出"按钮
- **搜索**：表格上方添加搜索输入框
