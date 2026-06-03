/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 市场观察新增/编辑表单
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
    <NDrawerContent :title="isEditMode ? '编辑观察' : '新增观察'">
      <NForm ref="formRef" :model="formData" :rules="rules" label-placement="top">
        <NFormItem label="观察时间" path="observeAt">
          <NDatePicker
            v-model:value="observeAtTimestamp"
            type="datetime"
            placeholder="选择观察时间"
          />
        </NFormItem>

        <NFormItem label="上证指数">
          <NSpace align="center" class="observation-form__number-field">
            <NInputNumber
              v-model:value="shanghaiIndexDisplay"
              :precision="2"
              placeholder="点"
              clearable
            />
            <span class="observation-form__suffix">点</span>
          </NSpace>
        </NFormItem>

        <NFormItem label="上证50">
          <NSpace align="center" class="observation-form__number-field">
            <NInputNumber
              v-model:value="sse50IndexDisplay"
              :precision="2"
              placeholder="点"
              clearable
            />
            <span class="observation-form__suffix">点</span>
          </NSpace>
        </NFormItem>

        <NFormItem label="沪深300">
          <NSpace align="center" class="observation-form__number-field">
            <NInputNumber
              v-model:value="csi300IndexDisplay"
              :precision="2"
              placeholder="点"
              clearable
            />
            <span class="observation-form__suffix">点</span>
          </NSpace>
        </NFormItem>

        <NFormItem label="市场成交额">
          <NSpace align="center" class="observation-form__number-field">
            <NInputNumber
              v-model:value="marketTurnoverDisplay"
              :precision="2"
              placeholder="元"
              clearable
            />
            <span class="observation-form__suffix">元</span>
          </NSpace>
        </NFormItem>

        <NFormItem label="市场情绪">
          <NSelect
            v-model:value="formData.sentiment"
            :options="sentimentOptions"
            placeholder="选择市场情绪（可选）"
            clearable
          />
        </NFormItem>

        <NFormItem label="政策事件">
          <NInput
            :value="formData.policyEvent ?? ''"
            type="textarea"
            placeholder="政策、监管、行业事件"
            :autosize="{ minRows: 3, maxRows: 6 }"
            @update:value="handlePolicyEventUpdate"
          />
        </NFormItem>

        <NFormItem label="宏观备注">
          <NInput
            :value="formData.macroNote ?? ''"
            type="textarea"
            placeholder="宏观、流动性、汇率等备注"
            :autosize="{ minRows: 3, maxRows: 6 }"
            @update:value="handleMacroNoteUpdate"
          />
        </NFormItem>

        <NFormItem label="个人观点">
          <NInput
            :value="formData.personalView ?? ''"
            type="textarea"
            placeholder="你对市场的判断"
            :autosize="{ minRows: 4, maxRows: 8 }"
            @update:value="handlePersonalViewUpdate"
          />
        </NFormItem>
      </NForm>

      <div class="observation-form__footer">
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
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
} from 'naive-ui'
import type { MarketObservation, MarketObservationCreatePayload } from '@/domain/types'
import { SENTIMENT_LABELS, SENTIMENTS } from '@/domain/types'
import { fenToYuan } from '@/domain/types/financial'

interface Props {
  visible: boolean
  observation?: MarketObservation | null
  loading?: boolean
}

interface Emits {
  (event: 'update:visible', value: boolean): void
  (event: 'submit', data: MarketObservationCreatePayload): void
}

const props = withDefaults(defineProps<Props>(), {
  observation: null,
  loading: false,
})

const emit = defineEmits<Emits>()
const formRef = ref<FormInst | null>(null)

const observeAtTimestamp = ref<number | null>(null)

const defaultFormData: MarketObservationCreatePayload = {
  observeAt: new Date().toISOString().slice(0, 19),
  shanghaiIndex: null,
  sse50Index: null,
  csi300Index: null,
  marketTurnover: null,
  sentiment: null,
  policyEvent: null,
  macroNote: null,
  personalView: null,
}

const formData = ref<MarketObservationCreatePayload>({ ...defaultFormData })
const initialSnapshot = ref('')

const isEditMode = computed(() => !!props.observation)
const isDirty = computed(() => JSON.stringify(formData.value) !== initialSnapshot.value)

// 指数: 存储 ×100, 显示用小数点值 (fenToYuan 语义: /100)
const shanghaiIndexDisplay = computed({
  get: () => (formData.value.shanghaiIndex !== null ? formData.value.shanghaiIndex / 100 : null),
  set: (val: number | null) => {
    formData.value.shanghaiIndex = val !== null ? Math.round(val * 100) : null
  },
})

const sse50IndexDisplay = computed({
  get: () => (formData.value.sse50Index !== null ? formData.value.sse50Index / 100 : null),
  set: (val: number | null) => {
    formData.value.sse50Index = val !== null ? Math.round(val * 100) : null
  },
})

const csi300IndexDisplay = computed({
  get: () => (formData.value.csi300Index !== null ? formData.value.csi300Index / 100 : null),
  set: (val: number | null) => {
    formData.value.csi300Index = val !== null ? Math.round(val * 100) : null
  },
})

// 成交额: 存储分, 显示用元 (fenToYuan)
const marketTurnoverDisplay = computed({
  get: () =>
    formData.value.marketTurnover !== null ? fenToYuan(formData.value.marketTurnover) : null,
  set: (val: number | null) => {
    formData.value.marketTurnover = val !== null ? Math.round(val * 100) : null
  },
})

const sentimentOptions = SENTIMENTS.map((sentiment) => ({
  label: SENTIMENT_LABELS[sentiment],
  value: sentiment,
}))

const rules: FormRules = {
  observeAt: [{ required: true, message: '请选择观察时间', trigger: 'change' }],
}

watch(
  () => [props.visible, props.observation] as const,
  ([visible, observation]) => {
    if (!visible) {
      return
    }

    if (observation) {
      formData.value = {
        observeAt: observation.observeAt,
        shanghaiIndex: observation.shanghaiIndex,
        sse50Index: observation.sse50Index,
        csi300Index: observation.csi300Index,
        marketTurnover: observation.marketTurnover,
        sentiment: observation.sentiment,
        policyEvent: observation.policyEvent,
        macroNote: observation.macroNote,
        personalView: observation.personalView,
      }
      observeAtTimestamp.value = new Date(observation.observeAt).getTime()
    } else {
      formData.value = { ...defaultFormData }
      observeAtTimestamp.value = Date.now()
    }

    nextTick(() => {
      initialSnapshot.value = JSON.stringify(formData.value)
    })
  },
  { immediate: true },
)

function handlePolicyEventUpdate(value: string): void {
  formData.value.policyEvent = value.trim() ? value : null
}

function handleMacroNoteUpdate(value: string): void {
  formData.value.macroNote = value.trim() ? value : null
}

function handlePersonalViewUpdate(value: string): void {
  formData.value.personalView = value.trim() ? value : null
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

    if (!observeAtTimestamp.value) {
      return
    }

    const observeAt = new Date(observeAtTimestamp.value).toISOString().slice(0, 19)
    emit('submit', { ...formData.value, observeAt })
  } catch {
    // validation failed
  }
}
</script>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  padding: 16px;
}

.observation-form__number-field {
  width: 100%;
}

.observation-form__number-field :deep(.n-input-number) {
  flex: 1;
}

.observation-form__suffix {
  color: #6b7280;
  flex-shrink: 0;
}

.observation-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
