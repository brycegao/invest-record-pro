/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 投资标的新增/编辑表单
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <NDrawer
    :show="visible"
    placement="right"
    width="520"
    :show-close="false"
    :mask-closable="!isDirty"
    :close-on-esc="!isDirty"
    @update:show="handleVisibleUpdate"
  >
    <NDrawerContent :title="isEditMode ? '编辑标的' : '新增标的'">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <NFormItem label="代码" path="code">
          <NInput
            v-model:value="formData.code"
            :disabled="isEditMode"
            placeholder="如：510300"
            maxlength="10"
          />
        </NFormItem>

        <NFormItem label="名称" path="name">
          <NInput v-model:value="formData.name" placeholder="如：沪深300ETF" maxlength="50" />
        </NFormItem>

        <NFormItem label="类型" path="type">
          <NSelect v-model:value="formData.type" :options="typeOptions" />
        </NFormItem>

        <NFormItem label="市场" path="market">
          <NSelect v-model:value="formData.market" :options="marketOptions" />
        </NFormItem>

        <NFormItem label="风险等级" path="riskLevel">
          <NSpace align="center" class="asset-form__risk">
            <NSlider v-model:value="formData.riskLevel" :min="1" :max="5" :step="1" />
            <NText class="asset-form__risk-value">{{ formData.riskLevel }}/5</NText>
          </NSpace>
        </NFormItem>

        <NFormItem label="跟踪指数" path="indexReference">
          <NInput
            :value="formData.indexReference ?? ''"
            placeholder="如：沪深300"
            @update:value="(value) => updateOptionalField('indexReference', value)"
          />
        </NFormItem>

        <NFormItem label="投资逻辑" path="logic">
          <NInput
            :value="formData.logic ?? ''"
            type="textarea"
            placeholder="记录选择该标的的核心原因"
            :autosize="{ minRows: 4, maxRows: 6 }"
            @update:value="(value) => updateOptionalField('logic', value)"
          />
        </NFormItem>

        <NFormItem label="备注" path="notes">
          <NInput
            :value="formData.notes ?? ''"
            type="textarea"
            placeholder="补充信息"
            :autosize="{ minRows: 2, maxRows: 4 }"
            @update:value="(value) => updateOptionalField('notes', value)"
          />
        </NFormItem>
      </NForm>

      <div class="asset-form__footer">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">保存</NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSlider,
  NSpace,
  NText,
  useMessage,
} from 'naive-ui'
import type { Asset, AssetCreatePayload } from '@/domain/types'
import { ASSET_TYPE_LABELS, ASSET_TYPES, MARKET_LABELS, MARKETS } from '@/domain/types'

interface Props {
  visible: boolean
  asset?: Asset | null
  loading?: boolean
}

interface Emits {
  (event: 'update:visible', value: boolean): void
  (event: 'submit', data: AssetCreatePayload): void
}

const props = withDefaults(defineProps<Props>(), {
  asset: null,
  loading: false,
})

const emit = defineEmits<Emits>()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

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
const initialSnapshot = ref('')

const isEditMode = computed(() => !!props.asset)
const isDirty = computed(() => JSON.stringify(formData.value) !== initialSnapshot.value)

const typeOptions = ASSET_TYPES.map((type) => ({
  label: ASSET_TYPE_LABELS[type],
  value: type,
}))

const marketOptions = MARKETS.map((market) => ({
  label: MARKET_LABELS[market],
  value: market,
}))

const rules: FormRules = {
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

watch(
  () => [props.visible, props.asset] as const,
  ([visible, asset]) => {
    if (!visible) {
      return
    }

    if (asset) {
      formData.value = {
        code: asset.code,
        name: asset.name,
        type: asset.type,
        market: asset.market,
        riskLevel: asset.riskLevel,
        indexReference: asset.indexReference,
        logic: asset.logic,
        notes: asset.notes,
      }
    } else {
      formData.value = { ...defaultFormData }
    }

    nextTick(() => {
      initialSnapshot.value = JSON.stringify(formData.value)
    })
  },
  { immediate: true },
)

function updateOptionalField(field: 'indexReference' | 'logic' | 'notes', value: string): void {
  formData.value[field] = value.trim() ? value : null
}

function handleVisibleUpdate(value: boolean): void {
  emit('update:visible', value)
}

function handleCancel(): void {
  emit('update:visible', false)
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate()
    emit('submit', { ...formData.value })
  } catch {
    message.error('请检查表单填写内容')
  }
}
</script>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  padding: 16px;
}

.asset-form__risk {
  width: 100%;
}

.asset-form__risk :deep(.n-slider) {
  flex: 1;
}

.asset-form__risk-value {
  width: 36px;
  text-align: right;
}

.asset-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
