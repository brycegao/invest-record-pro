# Vue 3 表单组件生成模板

## 用途

生成基于 Naive UI 的 Vue 3 表单组件，支持创建/编辑，包含字段验证、错误提示和提交处理。

## 使用方式

1. 复制本模板内容
2. 在"具体需求"部分填入：
   - 表单字段列表（名称、类型、验证规则）
   - 提交处理逻辑
   - 目标组件路径和文件名
3. 提交给 Codex

## 模板

### 系统提示
```
[使用 prompts/codex/system/system-prompt.txt]
```

### 任务描述

你需要生成一个 Vue 3 表单组件。

**组件功能**：
- 新建模式：表单为空，用户填入数据
- 编辑模式：表单预填现有数据，用户修改
- 字段级验证：实时反馈
- 提交：async 处理，显示加载状态
- 错误提示：表单级和全局 toast 提示

**使用场景**：
在 Modal / Drawer 或独立页面中使用，通过 props 传递 v-model 数据和 emit 回调。

### 具体需求

**表单字段**（示例）：
```ts
// 字段 1: code
// - 类型：string
// - 必填：是
// - 验证：长度 6-10，只能字母数字
// - 组件：NInput
// - 提示：资产代码，如 510050

// 字段 2: name
// - 类型：string
// - 必填：是
// - 验证：长度 2-50
// - 组件：NInput
// - 提示：资产名称

// ... 更多字段
```

**数据类型**：
```ts
interface FormData {
  // 按照 Asset / Plan / Trade 等模型定义
}
```

**提交处理**：
```ts
// 提交时调用的回调，应为 async 函数
// (formData: FormData) => Promise<void>
// 成功：显示 success toast，重置表单或关闭 dialog
// 失败：显示 error toast，保留表单数据供用户修改
```

**其他要求**：
- 目标路径：`src/features/[feature]/components/[FeatureName]Form.vue`
- 表单布局：竖向，label 在上方
- 必填字段：用红色 * 标记
- 按钮：取消 + 提交，提交中禁用

### 输出格式

完整的 Vue 3 组件代码，包括：
- `<template>` - Naive UI NForm、NFormItem、NInput 等
- `<script setup>` - TypeScript
- `<style scoped>` - CSS

## 核心特性

### Props
```ts
const props = defineProps<{
  modelValue: FormData       // 双向绑定数据
  loading: boolean           // 提交中状态
  title?: string             // 表单标题（新建/编辑）
}>()
```

### Emits
```ts
emits('update:modelValue', (data: FormData) => {})
emits('submit', (data: FormData) => Promise<void>)
```

### 内部实现
- 表单验证规则集中定义
- 错误信息显示在 NFormItem 下方
- 提交按钮在加载时显示 loading 状态
- 字段变化时自动更新 modelValue

## 示例 Prompt 完整版

```markdown
## 生成资产表单组件

基于以下需求生成 Vue 3 表单组件：

**表单字段**：
- code (string, 必填, 6-10字符, 正则验证): 资产代码
- name (string, 必填, 2-50字符): 资产名称  
- type (enum, 必填, ['ETF', '股票', '债券']): 资产类型
- market (enum, 必填, ['SH', 'SZ', 'HK', 'US']): 交易市场
- riskLevel (enum, 必填, ['低', '中等', '高']): 风险等级
- investmentThesis (string, 必填): 投资逻辑
- notes (string, 选填): 备注

**提交回调**：调用 async 函数 onSubmit(formData)

**目标路径**：src/features/assets/components/AssetForm.vue

**特殊要求**：
- 新建时 code 可编辑，编辑时 code 为 disabled（资产代码创建后不可修改）
- type 和 market 使用 Select 下拉框
- 投资逻辑使用 textarea（4行）
```

## 常见参数

| 参数 | 说明 | 示例 |
|------|------|------|
| 必填字段标记 | 红色 * | 标准 Naive UI 做法 |
| 验证失败提示 | 字段下方红字 | NFormItem 内置 |
| 提交中禁用 | 按钮 loading | `<n-button :loading="loading">` |
| Toast 提示 | 成功/失败 | `useMessage().success/error()` |
| 字段绑定 | v-model | `:value` + `@input` 双向绑定 |
