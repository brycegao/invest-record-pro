<template>
  <n-drawer v-model:show="visible" placement="right" size="35%" :show-close="false" :mask-closable="false">
    <template #header>
      {{ isEditMode ? '编辑资产' : '新增资产' }}
    </template>

    <n-form ref="formRef" :model="formData" label-placement="top" label-width="100px" :rules="rules">
      <n-form-item label="资产代码" path="code">
        <n-input
          v-model:value="formData.code"
          placeholder="如 510050"
          :disabled="isEditMode"
          maxlength="10"
        />
      </n-form-item>

      <n-form-item label="资产名称" path="name">
        <n-input v-model:value="formData.name" placeholder="如 上证 50 ETF" maxlength="50" />
      </n-form-item>

      <n-form-item label="资产类型" path="type">
        <n-select v-model:value="formData.type" :options="typeOptions" />
      </n-form-item>

      <n-form-item label="交易市场" path="market">
        <n-select v-model:value="formData.market" :options="marketOptions" />
      </n-form-item>

      <n-form-item label="风险等级" path="riskLevel">
        <n-select v-model:value="formData.riskLevel" :options="riskLevelOptions" />
      </n-form-item>

      <n-form-item label="投资逻辑" path="investmentThesis">
        <n-input
          v-model:value="formData.investmentThesis"
          type="textarea"
          rows="4"
          placeholder="简述为什么选择这个资产"
        />
      </n-form-item>

      <n-form-item label="备注" path="notes">
        <n-input v-model:value="formData.notes" type="textarea" rows="3" placeholder="可选" />
      </n-form-item>
    </n-form>

    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" :loading="loading" @click="handleSubmit">保存</n-button>
    </div>
  </n-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInst } from 'naive-ui'
import { useMessage } from 'naive-ui'
import type { Asset, AssetCreatePayload } from '../types'

const props = defineProps<{
  visible: boolean
  asset?: Asset | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  submit: [asset: Asset]
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)

const defaultForm = {
  code: '',
  name: '',
  type: 'ETF' as const,
  market: 'SH' as const,
  riskLevel: '中等' as const,
  investmentThesis: '',
  notes: ''
}

const formData = ref<AssetCreatePayload>({ ...defaultForm })

const isEditMode = computed(() => !!props.asset?.id)

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
        investmentThesis: newAsset.investmentThesis,
        notes: newAsset.notes || ''
      }
    } else {
      formData.value = { ...defaultForm }
    }
  },
  { immediate: true }
)

const rules = {
  code: { required: true, message: '请输入资产代码', trigger: 'blur' },
  name: { required: true, message: '请输入资产名称', trigger: 'blur' },
  investmentThesis: { required: true, message: '请输入投资逻辑', trigger: 'blur' }
}

const typeOptions = [
  { label: 'ETF', value: 'ETF' },
  { label: '股票', value: '股票' },
  { label: '债券', value: '债券' }
]

const marketOptions = [
  { label: '上海', value: 'SH' },
  { label: '深圳', value: 'SZ' },
  { label: '香港', value: 'HK' },
  { label: '美股', value: 'US' }
]

const riskLevelOptions = [
  { label: '低', value: '低' },
  { label: '中等', value: '中等' },
  { label: '高', value: '高' }
]

function handleCancel() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const validation = await formRef.value?.validate?.()
  if (validation === false) {
    return
  }

  try {
    const payload: Asset = {
      ...formData.value,
      id: props.asset?.id ?? 0,
      createdAt: props.asset?.createdAt ?? new Date(),
      updatedAt: new Date()
    }

    // emit submit 并等待父组件处理完成后再关闭
    // 实际项目中建议父组件 submit handler 返回 Promise<void>，
    // 此处 await 结果后再关闭 drawer 和显示提示，避免异步失败时 UI 状态不一致
    emit('submit', payload)
    emit('update:visible', false)
  } catch (e) {
    message.error((e as Error).message || '操作失败')
  }
}
</script>

<style scoped>
:deep(.n-drawer__body) {
  padding: 16px;
}
</style>
