# Batch 3e：Assets 模块 — 表单组件 AssetForm

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义在 `src/domain/types/`：Asset, AssetCreatePayload, ASSET_TYPES, MARKETS, RISK_LEVELS 等

## 任务

生成 Assets 模块的新增/编辑表单 Drawer 组件。

## 生成文件：`src/features/assets/components/AssetForm.vue`

### 组件功能

- 新建模式：表单为空，用户填入数据
- 编辑模式：表单预填现有数据，用户修改
- 字段级验证
- 提交：async 处理，显示加载状态
- 错误提示：toast

### Props

```ts
interface Props {
  visible: boolean
  asset?: Asset | null
  loading?: boolean
}
```

### Emits

```ts
interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: AssetCreatePayload): void
}
```

### Drawer 配置

- `placement="right"`
- `width="520"`
- `:show-close="false"`
- `:mask-closable="!isDirty"` — 表单有修改时禁止点击遮罩关闭
- `:close-on-esc="!isDirty"` — 表单有修改时禁止 ESC 关闭
- 标题：`isEditMode ? '编辑标的' : '新增标的'`

### 表单字段

| 字段 | 组件 | 必填 | 验证规则 | 备注 |
|------|------|------|----------|------|
| code | n-input | 是 | 不含空格，1-10 字符 | 编辑时 disabled |
| name | n-input | 是 | 1-50 字符 | |
| type | n-select | 是 | ASSET_TYPES 枚举 | stock/etf/fund/index/bond |
| market | n-select | 是 | MARKETS 枚举 | CN/HK/US，默认 CN |
| riskLevel | n-slider + 数字 | 否 | 1-5，默认 3 | 显示当前值 |
| indexReference | n-input | 否 | | 跟踪指数，placeholder="如：沪深300" |
| logic | n-input textarea | 否 | rows=4 | 投资逻辑 |
| notes | n-input textarea | 否 | rows=2 | 备注 |

### select 选项

```ts
const typeOptions = ASSET_TYPES.map(t => ({ label: ASSET_TYPE_LABELS[t], value: t }))
const marketOptions = MARKETS.map(m => ({ label: MARKET_LABELS[m], value: m }))
```

### 表单验证规则

```ts
const rules = {
  code: [
    { required: true, message: '请输入标的代码', trigger: 'blur' },
    { pattern: /^\S+$/, message: '代码不能包含空格', trigger: 'blur' },
    { min: 1, max: 10, message: '代码长度 1-10 字符', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入标的名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度 1-50 字符', trigger: 'blur' },
  ],
  type: { required: true, message: '请选择类型', trigger: 'change' },
  market: { required: true, message: '请选择市场', trigger: 'change' },
}
```

### 提交逻辑

```ts
async function handleSubmit() {
  await formRef.value?.validate()
  emit('submit', { ...formData.value })
}
```

### 取消逻辑

```ts
function handleCancel() {
  emit('update:visible', false)
}
```

### dirty 状态检测（统一快照对比）

无论新建还是编辑模式，都在表单数据初始化时拍快照，dirty 只需对比当前值与快照是否一致：

```ts
const defaultFormData: AssetCreatePayload = {
  code: '',
  name: '',
  type: 'etf',
  market: 'CN',
  riskLevel: 3,
  indexReference: null,
  logic: null,
  notes: null,
}

const formData = ref<AssetCreatePayload>({ ...defaultFormData })
const initialSnapshot = ref<string>('')

watch(
  () => props.asset,
  (newAsset) => {
    if (newAsset) {
      formData.value = {
        code: newAsset.code,
        name: newAsset.name,
        type: newAsset.type,
        market: newAsset.market,
        riskLevel: newAsset.riskLevel,
        indexReference: newAsset.indexReference,
        logic: newAsset.logic,
        notes: newAsset.notes,
      }
    } else {
      formData.value = { ...defaultFormData }
    }
    // 统一：初始化完成后立即拍快照
    nextTick(() => {
      initialSnapshot.value = JSON.stringify(formData.value)
    })
  },
  { immediate: true },
)

// 统一：新建/编辑都用同一套对比逻辑
const isDirty = computed(() => {
  return JSON.stringify(formData.value) !== initialSnapshot.value
})
```

### 数据初始化

数据初始化已包含在上方的 watch 中，无需单独重复定义。

### 底部按钮

```vue
<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
  <n-button @click="handleCancel">取消</n-button>
  <n-button type="primary" :loading="loading" @click="handleSubmit">保存</n-button>
</div>
```

### Drawer 内 padding

```vue
<style scoped>
:deep(.n-drawer-body) {
  padding: 16px;
}
</style>
```

## 代码风格

- `<script setup lang="ts">`
- Props 使用 interface
- Emits 显式类型声明
- CSS `scoped`
- 禁止 any 类型
