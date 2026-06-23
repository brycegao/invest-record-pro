/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
CreateSnapshotDrawer 组件 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See
LICENSE file in the project root for full license information. */

<template>
  <NDrawer :show="visible" placement="right" width="520" :show-close="false" @close="handleClose">
    <NDrawerContent title="生成仓位快照">
      <NForm labelPlacement="left" labelWidth="100">
        <NFormItem label="快照日期">
          <NDatePicker v-model:value="form.snapshotAt" type="date" placeholder="选择日期" />
        </NFormItem>
        <NFormItem label="总资产">
          <NSpace align="center">
            <NInputNumber
              v-model:value="form.totalAssets"
              :precision="2"
              :min="0"
              :show-button="false"
              placeholder="请输入总资产"
            />
            <span class="input-unit">元</span>
          </NSpace>
        </NFormItem>
        <NFormItem label="现金">
          <NSpace align="center">
            <NInputNumber
              v-model:value="form.cash"
              :precision="2"
              :min="0"
              :show-button="false"
              placeholder="请输入现金"
            />
            <span class="input-unit">元</span>
          </NSpace>
        </NFormItem>
      </NForm>

      <div class="holding-section">
        <div class="holding-section__header">
          <span>当前持仓标的</span>
          <span class="holding-section__tip">输入当前价后会实时显示市值和浮动盈亏</span>
        </div>

        <div v-if="loading" class="holding-loading">加载持仓中……</div>
        <div v-else-if="holdings.length === 0" class="holding-empty">
          <NEmpty description="暂无持仓数据" />
        </div>
        <div v-else class="holding-table">
          <div class="holding-table__row holding-table__header">
            <div>标的</div>
            <div>当前价</div>
            <div>市值</div>
            <div>浮动盈亏</div>
          </div>
          <div class="holding-table__row" v-for="item in holdings" :key="item.assetId">
            <div class="holding-label">
              <div>{{ item.assetCode }} {{ item.assetName }}</div>
              <div class="holding-subtitle">数量 {{ formatQuantity(item.currentQuantity) }}</div>
            </div>
            <div class="holding-input">
              <NInputNumber
                v-model:value="holdingPrices[item.assetId]"
                :precision="2"
                :min="0"
                :show-button="false"
                placeholder="元"
              />
            </div>
            <div>{{ formatMoney(calculateHoldingMarketValue(item)) }}</div>
            <div :class="getMoneyClass(calculateHoldingUnrealized(item))">
              {{ formatSignedMoney(calculateHoldingUnrealized(item)) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="drawer-error">{{ errorMessage }}</div>

      <div class="drawer-actions">
        <NButton secondary @click="handleClose">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit"> 生成快照 </NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  NButton,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
} from 'naive-ui'
import type { PositionCreatePayload } from '@/domain/types'
import {
  calculateTotalAmount,
  fenToYuan,
  formatMoney,
  formatQuantity,
  formatSignedMoney,
  yuanToFen,
} from '@/domain/types/financial'
import { getAllHoldings, type HoldingInfo } from '@/services/position-calculation.service'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void
  (event: 'submit', payload: PositionCreatePayload): void
}>()

const form = ref({
  snapshotAt: null as number | null,
  totalAssets: null as number | null,
  cash: null as number | null,
})

const holdings = ref<HoldingInfo[]>([])
const holdingPrices = ref<Record<number, number>>({})
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

function resetForm(): void {
  form.value = {
    snapshotAt: null,
    totalAssets: null,
    cash: null,
  }
  holdings.value = []
  holdingPrices.value = {}
  errorMessage.value = null
}

async function loadHoldings(): Promise<void> {
  loading.value = true
  errorMessage.value = null
  try {
    holdings.value = await getAllHoldings()
    holdings.value.forEach((item) => {
      holdingPrices.value[item.assetId] = fenToYuan(item.avgCost)
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载持仓失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  async (value) => {
    if (value) {
      resetForm()
      await loadHoldings()
    }
  },
)

function handleClose(): void {
  emit('update:visible', false)
}

function getMoneyClass(value: number): string {
  if (value > 0) {
    return 'money-positive'
  }
  if (value < 0) {
    return 'money-negative'
  }
  return 'money-zero'
}

function calculateHoldingMarketValue(item: HoldingInfo): number {
  const priceFen = yuanToFen(holdingPrices.value[item.assetId] ?? 0)
  return calculateTotalAmount(priceFen, item.currentQuantity)
}

function calculateHoldingUnrealized(item: HoldingInfo): number {
  const marketValue = calculateHoldingMarketValue(item)
  return marketValue - calculateTotalAmount(item.avgCost, item.currentQuantity)
}

async function handleSubmit(): Promise<void> {
  errorMessage.value = null
  if (!form.value.snapshotAt) {
    errorMessage.value = '请先选择快照日期'
    return
  }

  if ((form.value.totalAssets ?? 0) < 0 || (form.value.cash ?? 0) < 0) {
    errorMessage.value = '总资产和现金必须为非负数'
    return
  }

  let items
  try {
    items = holdings.value.map((item) => {
      const price = holdingPrices.value[item.assetId]

      if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
        throw new Error(`请输入 ${item.assetCode} 当前价`)
      }

      const currentPriceFen = yuanToFen(price)
      const marketValue = calculateTotalAmount(currentPriceFen, item.currentQuantity)
      const unrealizedPnl = marketValue - calculateTotalAmount(item.avgCost, item.currentQuantity)

      return {
        assetId: item.assetId,
        quantity: item.currentQuantity,
        avgCost: item.avgCost,
        currentPrice: currentPriceFen,
        marketValue,
        unrealizedPnl,
      }
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '输入的持仓价格格式不正确'
    return
  }

  const snapshotDate = new Date(form.value.snapshotAt).toISOString().slice(0, 10)
  const payload: PositionCreatePayload = {
    snapshotAt: snapshotDate,
    cash: yuanToFen(form.value.cash ?? 0),
    totalAssets: yuanToFen(form.value.totalAssets ?? 0),
    unrealizedPnl: items.reduce((sum, item) => sum + item.unrealizedPnl, 0),
    realizedPnl: 0,
    items,
  }

  submitting.value = true
  try {
    emit('submit', payload)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '生成快照失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.holding-section {
  margin-top: 24px;
}

.holding-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #4b5563;
}

.holding-section__tip {
  color: #6b7280;
}

.holding-loading,
.holding-empty {
  padding: 16px 0;
}

.holding-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.holding-table__row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.holding-table__header {
  color: #6b7280;
  font-size: 13px;
  border-bottom: 1px solid #e5e7eb;
}

.holding-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.holding-subtitle {
  color: #6b7280;
  font-size: 12px;
}

.holding-input {
  min-width: 120px;
}

.input-unit {
  color: #4b5563;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.drawer-error {
  margin-top: 16px;
  color: #b91c1c;
}
</style>
