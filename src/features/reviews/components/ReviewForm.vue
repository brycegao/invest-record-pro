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
    <NDrawerContent :title="isEditMode ? '编辑复盘' : '新增复盘'">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <NFormItem label="关联交易" path="tradeId">
          <NSelect
            v-model:value="formData.tradeId"
            :options="tradeOptions"
            filterable
            placeholder="搜索并选择关联交易"
            :loading="tradeLoading"
            @search="handleTradeSearch"
          />
        </NFormItem>

        <div v-if="selectedTradeSummary" class="review-form__trade-summary">
          <NTag size="small" type="info">交易摘要</NTag>
          <span class="review-form__trade-summary-text">{{ selectedTradeSummary }}</span>
        </div>

        <NFormItem label="交易结果" path="result">
          <NRadioGroup v-model:value="formData.result">
            <NSpace>
              <NRadio v-for="option in resultOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>

        <NFormItem label="问题类型">
          <NSelect
            v-model:value="formData.issueType"
            :options="issueTypeOptions"
            placeholder="选择问题类型（可选）"
            clearable
          />
        </NFormItem>

        <NFormItem label="总结" path="summary">
          <NInput
            v-model:value="formData.summary"
            type="textarea"
            placeholder="记录这次交易的整体评价和反思"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </NFormItem>

        <NFormItem label="改进点">
          <NInput
            :value="formData.improve ?? ''"
            type="textarea"
            placeholder="下次可以改进的地方（可选）"
            :autosize="{ minRows: 4, maxRows: 8 }"
            @update:value="handleImproveUpdate"
          />
        </NFormItem>
      </NForm>

      <div class="review-form__footer">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">保存</NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui'
import type { Review, ReviewCreatePayload, Trade } from '@/domain/types'
import {
  ISSUE_TYPE_LABELS,
  ISSUE_TYPES,
  REVIEW_RESULT_LABELS,
  REVIEW_RESULTS,
  TRADE_TYPE_LABELS,
} from '@/domain/types'

interface Props {
  visible: boolean
  review?: Review | null
  loading?: boolean
}

interface Emits {
  (event: 'update:visible', value: boolean): void
  (event: 'submit', data: ReviewCreatePayload): void
}

const props = withDefaults(defineProps<Props>(), {
  review: null,
  loading: false,
})

const emit = defineEmits<Emits>()
const route = useRoute()
const formRef = ref<FormInst | null>(null)

const defaultFormData: ReviewCreatePayload = {
  tradeId: 0,
  result: 'neutral',
  issueType: null,
  summary: '',
  improve: null,
}

const formData = ref<ReviewCreatePayload>({ ...defaultFormData })
const initialSnapshot = ref('')
const tradeOptions = ref<SelectOption[]>([])
const tradeLoading = ref(false)
const allTrades = ref<Trade[]>([])

const isEditMode = computed(() => !!props.review)
const isDirty = computed(() => JSON.stringify(formData.value) !== initialSnapshot.value)

const resultOptions = REVIEW_RESULTS.map((result) => ({
  label: REVIEW_RESULT_LABELS[result],
  value: result,
}))

const issueTypeOptions = ISSUE_TYPES.map((issueType) => ({
  label: ISSUE_TYPE_LABELS[issueType],
  value: issueType,
}))

const selectedTradeSummary = computed(() => {
  if (!formData.value.tradeId) {
    return ''
  }

  const trade = allTrades.value.find((t) => t.id === formData.value.tradeId)

  if (!trade) {
    return ''
  }

  const code = trade.assetCode ?? trade.assetId.toString()
  const type =
    TRADE_TYPE_LABELS[trade.tradeType as keyof typeof TRADE_TYPE_LABELS] ?? trade.tradeType
  const date = trade.tradeAt?.slice(0, 10) ?? ''
  const price = trade.price / 100
  const quantity = trade.quantity / 1000

  return `${code} ${type} ${date} — 价格 ${price.toFixed(2)} × ${quantity.toFixed(3)}`
})

const rules: FormRules = {
  tradeId: [
    { required: true, type: 'number', min: 1, message: '请选择关联交易', trigger: 'change' },
  ],
  result: [{ required: true, message: '请选择交易结果', trigger: 'change' }],
  summary: [
    { required: true, message: '请输入总结', trigger: 'blur' },
    { min: 1, max: 2000, message: '总结长度 1-2000 字符', trigger: 'blur' },
  ],
}

watch(
  () => [props.visible, props.review] as const,
  async ([visible, review]) => {
    if (!visible) {
      return
    }

    if (review) {
      formData.value = {
        tradeId: review.tradeId,
        result: review.result,
        issueType: review.issueType,
        summary: review.summary,
        improve: review.improve,
      }
    } else {
      formData.value = { ...defaultFormData }

      // 从 URL query 预填 tradeId（从交易记录页面跳转）
      const queryTradeId = route.query.tradeId
      if (queryTradeId) {
        const tradeId = Number(queryTradeId)
        if (Number.isFinite(tradeId) && tradeId > 0) {
          formData.value.tradeId = tradeId
        }
      }
    }

    await loadTradeOptions()
    nextTick(() => {
      initialSnapshot.value = JSON.stringify(formData.value)
    })
  },
  { immediate: true },
)

async function loadTradeOptions(): Promise<void> {
  tradeLoading.value = true

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    allTrades.value = await invoke<Trade[]>('get_trades')
    tradeOptions.value = allTrades.value.map((trade) => ({
      label: formatTradeOption(trade),
      value: trade.id,
    }))
  } catch {
    tradeOptions.value = []
  } finally {
    tradeLoading.value = false
  }
}

function formatTradeOption(trade: Trade): string {
  const code = trade.assetCode ?? ''
  const type =
    TRADE_TYPE_LABELS[trade.tradeType as keyof typeof TRADE_TYPE_LABELS] ?? trade.tradeType
  const date = trade.tradeAt?.slice(0, 10) ?? ''

  return `${code} ${type} ${date}`
}

function handleTradeSearch(keyword: string): void {
  if (!keyword.trim()) {
    tradeOptions.value = allTrades.value.map((trade) => ({
      label: formatTradeOption(trade),
      value: trade.id,
    }))
    return
  }

  const lowerKeyword = keyword.toLowerCase()
  tradeOptions.value = allTrades.value
    .filter((trade) => {
      const code = (trade.assetCode ?? '').toLowerCase()
      const name = (trade.assetName ?? '').toLowerCase()
      return code.includes(lowerKeyword) || name.includes(lowerKeyword)
    })
    .map((trade) => ({
      label: formatTradeOption(trade),
      value: trade.id,
    }))
}

function handleImproveUpdate(value: string): void {
  formData.value.improve = value.trim() ? value : null
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
    // validation failed
  }
}
</script>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  padding: 16px;
}

.review-form__trade-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.review-form__trade-summary-text {
  color: #4b5563;
}

.review-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
