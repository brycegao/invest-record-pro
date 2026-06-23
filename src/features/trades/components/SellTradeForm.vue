/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
卖出交易表单 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See LICENSE file
in the project root for full license information. */

<template>
  <NDrawer
    :show="visible"
    placement="right"
    width="520"
    :show-close="false"
    @update:show="handleVisibleUpdate"
  >
    <NDrawerContent title="卖出">
      <NForm ref="formRef" :model="formData" :rules="formRules" label-placement="top">
        <NFormItem label="成交时间" path="tradeAt">
          <NDatePicker v-model:value="tradeAtValue" type="datetime" class="trade-form__full" />
        </NFormItem>

        <NFormItem label="标的" path="assetId">
          <NSelect
            v-model:value="formData.assetId"
            :options="assetOptions"
            :loading="assetLoading"
            filterable
            remote
            clearable
            placeholder="搜索代码或名称"
            @search="handleAssetSearch"
            @update:value="handleAssetChange"
          />
        </NFormItem>

        <NAlert v-if="summary" :type="summary.currentQuantity > 0 ? 'info' : 'warning'">
          当前持仓：{{ formatQuantity(summary.currentQuantity) }}，成本价
          {{ formatMoney(summary.avgCost) }}，可用 {{ formatQuantity(summary.currentQuantity) }}
        </NAlert>

        <NFormItem label="数量" path="quantity">
          <NSpace align="center" class="trade-form__full">
            <NInputNumber
              v-model:value="quantityDisplay"
              :precision="3"
              :step="0.001"
              :min="0.001"
              :max="maxQuantityDisplay"
              placeholder="卖出数量"
            />
            <NText>手/份</NText>
          </NSpace>
        </NFormItem>

        <NFormItem label="价格" path="price">
          <NSpace align="center" class="trade-form__full">
            <NInputNumber
              v-model:value="priceYuan"
              :precision="2"
              :step="0.01"
              :min="0"
              placeholder="成交价格"
            />
            <NText>元</NText>
          </NSpace>
        </NFormItem>

        <NDescriptions :column="1" bordered size="small">
          <NDescriptionsItem label="预计盈亏">
            <span :class="getMoneyColor(estimatedPnlFen)">{{
              formatSignedMoney(estimatedPnlFen)
            }}</span>
          </NDescriptionsItem>
          <NDescriptionsItem label="公式"
            >(sell_price - avg_cost) × sell_quantity - fee</NDescriptionsItem
          >
        </NDescriptions>

        <NCollapse class="trade-form__more">
          <NCollapseItem title="更多选项" name="more">
            <NFormItem label="手续费" path="fee">
              <NSpace align="center" class="trade-form__full">
                <NInputNumber v-model:value="feeYuan" :precision="2" :min="0" :step="0.01" />
                <NText>元</NText>
              </NSpace>
            </NFormItem>

            <NFormItem label="指数点位" path="indexPoint">
              <NSpace align="center" class="trade-form__full">
                <NInputNumber
                  v-model:value="indexPointDisplay"
                  :precision="2"
                  :min="0"
                  :step="0.01"
                  clearable
                />
                <NText>点</NText>
              </NSpace>
            </NFormItem>

            <NFormItem label="交易原因" path="reason">
              <NInput
                :value="reasonText"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
                @update:value="(value) => (reasonText = value)"
              />
            </NFormItem>

            <NFormItem label="遵守计划" path="followPlan">
              <NSwitch v-model:value="followPlan" />
            </NFormItem>

            <NFormItem v-if="followPlan" label="关联计划" path="planId">
              <NSelect
                v-model:value="planId"
                :options="planOptions"
                :loading="planLoading"
                clearable
                placeholder="选择卖出计划"
              />
            </NFormItem>

            <NFormItem label="情绪" path="mood">
              <NSelect v-model:value="mood" :options="moodOptions" />
            </NFormItem>

            <NFormItem label="备注" path="notes">
              <NInput
                :value="notesText"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 4 }"
                @update:value="(value) => (notesText = value)"
              />
            </NFormItem>
          </NCollapseItem>
        </NCollapse>
      </NForm>

      <div class="trade-form__footer">
        <NButton @click="handleCancel">取消</NButton>
        <NButton
          type="primary"
          :loading="loading"
          :disabled="!summary || summary.currentQuantity <= 0"
          @click="handleSubmit"
        >
          保存
        </NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCollapse,
  NCollapseItem,
  NDatePicker,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NText,
  useMessage,
} from 'naive-ui'
import type { Mood, Trade, TradeCreatePayload, TradeSummary } from '@/domain/types'
import { MOOD_LABELS, MOODS } from '@/domain/types'
import {
  calculateTotalAmount,
  displayQuantity,
  fenToYuan,
  formatMoney,
  formatQuantity,
  formatSignedMoney,
  getMoneyColor,
  storeQuantity,
  yuanToFen,
} from '@/domain/types/financial'
import { searchAssetOptions, type AssetLookupOption } from '@/services/asset-lookup.service'
import { getPlanOptions, type PlanLookupOption } from '@/services/plan-lookup.service'
import { getTradeSummary } from '../repository'

interface Props {
  visible: boolean
  trade?: Trade | null
  loading?: boolean
}

interface Emits {
  (event: 'update:visible', value: boolean): void
  (event: 'submit', data: TradeCreatePayload): void
}

const props = withDefaults(defineProps<Props>(), {
  trade: null,
  loading: false,
})

const emit = defineEmits<Emits>()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const tradeAtValue = ref(Date.now())
const assetOptions = ref<AssetLookupOption[]>([])
const assetLoading = ref(false)
const planOptions = ref<PlanLookupOption[]>([])
const planLoading = ref(false)
const priceYuan = ref<number | null>(null)
const quantityDisplay = ref<number | null>(null)
const feeYuan = ref(0)
const indexPointDisplay = ref<number | null>(null)
const reasonText = ref('')
const followPlan = ref(true)
const planId = ref<number | null>(null)
const mood = ref<Mood>('calm')
const notesText = ref('')
const summary = ref<TradeSummary | null>(null)

const formData = ref({
  assetId: 0,
  price: 0,
  quantity: 0,
  tradeAt: '',
})

const moodOptions = MOODS.map((item) => ({
  label: MOOD_LABELS[item],
  value: item,
}))

const maxQuantityDisplay = computed(() =>
  summary.value ? displayQuantity(summary.value.currentQuantity) : undefined,
)
const priceFen = computed(() => yuanToFen(priceYuan.value ?? 0))
const quantityInt = computed(() => storeQuantity(quantityDisplay.value ?? 0))
const feeFen = computed(() => yuanToFen(feeYuan.value ?? 0))
const totalAmountFen = computed(() => calculateTotalAmount(priceFen.value, quantityInt.value))
const estimatedPnlFen = computed(() => {
  if (!summary.value) {
    return 0
  }

  const costOfSold = (summary.value.avgCost * quantityInt.value) / 1000
  return Math.trunc(totalAmountFen.value - costOfSold - feeFen.value)
})

const formRules: FormRules = {
  tradeAt: { required: true, message: '请选择成交时间', trigger: 'change' },
  assetId: { required: true, type: 'number', min: 1, message: '请选择标的', trigger: 'change' },
  price: { required: true, type: 'number', min: 1, message: '请输入成交价格', trigger: 'blur' },
  quantity: {
    required: true,
    type: 'number',
    min: 1,
    validator() {
      if (!summary.value || quantityInt.value <= summary.value.currentQuantity) {
        return true
      }

      return new Error('卖出数量不能超过当前持仓')
    },
    trigger: 'blur',
  },
}

watch(
  () => [props.visible, props.trade] as const,
  ([visible, trade]) => {
    if (!visible) {
      return
    }

    if (trade) {
      tradeAtValue.value = dayjs(trade.tradeAt).valueOf()
      formData.value.assetId = trade.assetId
      priceYuan.value = fenToYuan(trade.price)
      quantityDisplay.value = displayQuantity(trade.quantity)
      feeYuan.value = fenToYuan(trade.fee)
      indexPointDisplay.value = trade.indexPoint === null ? null : trade.indexPoint / 100
      reasonText.value = trade.reason ?? ''
      followPlan.value = trade.followPlan
      planId.value = trade.planId
      mood.value = trade.mood ?? 'calm'
      notesText.value = trade.notes ?? ''
      void loadSummary(trade.assetId)
    } else {
      tradeAtValue.value = Date.now()
      formData.value.assetId = 0
      priceYuan.value = null
      quantityDisplay.value = null
      feeYuan.value = 0
      indexPointDisplay.value = null
      reasonText.value = ''
      followPlan.value = true
      planId.value = null
      mood.value = 'calm'
      notesText.value = ''
      summary.value = null
    }

    syncValidationModel()
    void loadAssetOptions()
  },
  { immediate: true },
)

watch([tradeAtValue, priceYuan, quantityDisplay], syncValidationModel)

async function loadAssetOptions(keyword = ''): Promise<void> {
  assetLoading.value = true

  try {
    assetOptions.value = await searchAssetOptions(keyword)
  } catch {
    message.error('加载标的选项失败')
  } finally {
    assetLoading.value = false
  }
}

async function loadSummary(assetId: number): Promise<void> {
  if (!assetId) {
    summary.value = null
    return
  }

  try {
    summary.value = await getTradeSummary(assetId)
  } catch {
    summary.value = null
    message.error('加载持仓信息失败')
  }
}

async function loadPlanOptions(assetId: number): Promise<void> {
  if (!assetId) {
    planOptions.value = []
    return
  }

  planLoading.value = true

  try {
    planOptions.value = await getPlanOptions(assetId, 'sell')
  } catch {
    message.error('加载计划选项失败')
  } finally {
    planLoading.value = false
  }
}

function syncValidationModel(): void {
  formData.value.tradeAt = dayjs(tradeAtValue.value).toISOString()
  formData.value.price = priceFen.value
  formData.value.quantity = quantityInt.value
}

function handleAssetSearch(keyword: string): void {
  void loadAssetOptions(keyword)
}

function handleAssetChange(value: number | null): void {
  formData.value.assetId = value ?? 0
  planId.value = null
  void loadSummary(formData.value.assetId)
  void loadPlanOptions(formData.value.assetId)
}

function toNullableText(value: string): string | null {
  return value.trim() ? value : null
}

function buildPayload(): TradeCreatePayload {
  return {
    assetId: formData.value.assetId,
    planId: followPlan.value ? planId.value : null,
    tradeAt: dayjs(tradeAtValue.value).toISOString(),
    tradeType: 'sell',
    quantity: quantityInt.value,
    price: priceFen.value,
    totalAmount: totalAmountFen.value,
    fee: feeFen.value,
    indexPoint: indexPointDisplay.value === null ? null : Math.round(indexPointDisplay.value * 100),
    reason: toNullableText(reasonText.value),
    followPlan: followPlan.value,
    mood: mood.value,
    notes: toNullableText(notesText.value),
  }
}

function handleVisibleUpdate(value: boolean): void {
  emit('update:visible', value)
}

function handleCancel(): void {
  emit('update:visible', false)
}

async function handleSubmit(): Promise<void> {
  syncValidationModel()

  try {
    await formRef.value?.validate()
    emit('submit', buildPayload())
  } catch {
    message.error('请检查表单填写内容')
  }
}
</script>

<style scoped>
.trade-form__full {
  width: 100%;
}

.trade-form__more {
  margin-top: 16px;
}

.trade-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.money-positive {
  color: #16a34a;
}

.money-negative {
  color: #dc2626;
}

.money-zero {
  color: #6b7280;
}
</style>
