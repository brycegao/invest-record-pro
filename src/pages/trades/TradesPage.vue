/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易记录管理页面
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <div class="trades-page">
    <div class="trades-page__header">
      <div>
        <h2 class="trades-page__title">交易记录</h2>
        <p class="trades-page__description">记录每一笔实际成交</p>
      </div>
    </div>

    <NSpace class="trades-page__actions">
      <NButton type="primary" @click="handleCreateBuy">+ 买入</NButton>
      <NButton type="primary" secondary @click="handleCreateSell">+ 卖出</NButton>
      <NButton :loading="exporting" @click="handleExport">导出 CSV</NButton>
    </NSpace>

    <NSpace align="end" class="trades-page__filters">
      <NFormItem label="标的" class="trades-page__filter-item">
        <NInput
          v-model:value="filterKeyword"
          placeholder="搜索代码或名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </NFormItem>

      <NFormItem label="交易类型" class="trades-page__select-item">
        <NSelect v-model:value="filterTradeType" :options="tradeTypeOptions" />
      </NFormItem>

      <NFormItem label="日期范围" class="trades-page__date-item">
        <NDatePicker v-model:value="filterDateRange" type="daterange" clearable />
      </NFormItem>

      <NFormItem label="遵守计划" class="trades-page__select-item">
        <NSelect v-model:value="filterFollowPlan" :options="followPlanOptions" />
      </NFormItem>

      <NFormItem label="情绪" class="trades-page__select-item">
        <NSelect v-model:value="filterMood" :options="moodOptions" />
      </NFormItem>

      <NFormItem label=" " class="trades-page__button-item">
        <NSpace>
          <NButton type="primary" :loading="store.isLoading" @click="handleSearch">搜索</NButton>
          <NButton :disabled="store.isLoading" @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NSpace>

    <TradeTable
      :data="store.trades"
      :loading="store.isLoading"
      :hidden-columns="['fee', 'mood']"
      @edit="handleEdit"
      @review="handleReview"
      @delete="handleDelete"
    />

    <BuyTradeForm
      :visible="buyFormVisible"
      :trade="editingBuyTrade"
      :loading="store.isLoading"
      @update:visible="handleBuyFormVisibleUpdate"
      @submit="handleBuySubmit"
    />

    <SellTradeForm
      :visible="sellFormVisible"
      :trade="editingSellTrade"
      :loading="store.isLoading"
      @update:visible="handleSellFormVisibleUpdate"
      @submit="handleSellSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  NButton,
  NDatePicker,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui'
import { BuyTradeForm, SellTradeForm, TradeTable } from '@/features/trades/components'
import { useTradeStore } from '@/features/trades/store'
import type { Mood, Trade, TradeCreatePayload, TradeFilter, TradeType } from '@/domain/types'
import { MOOD_LABELS, MOODS, TRADE_TYPE_LABELS, TRADE_TYPES } from '@/domain/types'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { exportTradesCsv } from '@/features/settings/repository'

const router = useRouter()
const message = useMessage()
const store = useTradeStore()

const buyFormVisible = ref(false)
const sellFormVisible = ref(false)
const editingTrade = ref<Trade | null>(null)
const filterKeyword = ref('')
const filterTradeType = ref<TradeFilter['tradeType']>('')
const filterDateRange = ref<[number, number] | null>(null)
const filterFollowPlan = ref('')
const filterMood = ref<TradeFilter['mood']>('')

const tradeTypeOptions = [
  { label: '全部', value: '' },
  ...TRADE_TYPES.map((tradeType) => ({ label: TRADE_TYPE_LABELS[tradeType], value: tradeType })),
]

const followPlanOptions = [
  { label: '全部', value: '' },
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
]

const moodOptions = [
  { label: '全部', value: '' },
  ...MOODS.map((mood) => ({ label: MOOD_LABELS[mood], value: mood })),
]

const editingBuyTrade = ref<Trade | null>(null)
const editingSellTrade = ref<Trade | null>(null)
const exporting = ref(false)

onMounted(async () => {
  await store.loadTrades()
  showStoreError()
})

function showStoreError(): boolean {
  if (store.error) {
    message.error(store.error)
    return true
  }

  return false
}

function hasActiveFilters(): boolean {
  return (
    !!filterKeyword.value.trim() ||
    !!filterTradeType.value ||
    !!filterDateRange.value ||
    filterFollowPlan.value !== '' ||
    !!filterMood.value
  )
}

async function refreshTrades(): Promise<void> {
  if (hasActiveFilters()) {
    await handleSearch()
    return
  }

  await store.loadTrades()
}

function dateRangeToFilter(): Pick<TradeFilter, 'startDate' | 'endDate'> {
  if (!filterDateRange.value) {
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }

  return {
    startDate: dayjs(filterDateRange.value[0]).toISOString(),
    endDate: dayjs(filterDateRange.value[1]).endOf('day').toISOString(),
  }
}

function followPlanToFilter(): TradeFilter['followPlan'] {
  if (filterFollowPlan.value === 'true') {
    return true
  }

  if (filterFollowPlan.value === 'false') {
    return false
  }

  return ''
}

function handleCreateBuy(): void {
  editingTrade.value = null
  editingBuyTrade.value = null
  buyFormVisible.value = true
}

function handleCreateSell(): void {
  editingTrade.value = null
  editingSellTrade.value = null
  sellFormVisible.value = true
}

function handleEdit(row: Trade): void {
  editingTrade.value = row

  if (row.tradeType === 'buy') {
    editingBuyTrade.value = row
    buyFormVisible.value = true
  } else {
    editingSellTrade.value = row
    sellFormVisible.value = true
  }
}

function handleReview(row: Trade): void {
  void router.push({ path: '/reviews', query: { tradeId: String(row.id) } })
}

async function handleDelete(row: Trade): Promise<void> {
  await store.deleteTrade(row.id)

  if (!showStoreError()) {
    message.success('删除成功')
  }
}

async function handleBuySubmit(data: TradeCreatePayload): Promise<void> {
  await submitTrade(data)
}

async function handleSellSubmit(data: TradeCreatePayload): Promise<void> {
  await submitTrade(data)
}

async function submitTrade(data: TradeCreatePayload): Promise<void> {
  if (editingTrade.value) {
    await store.updateTrade({
      ...data,
      id: editingTrade.value.id,
    })
  } else {
    await store.createTrade(data)
  }

  if (showStoreError()) {
    return
  }

  message.success(editingTrade.value ? '更新成功' : '创建成功')
  closeForms()
  await refreshTrades()
}

async function handleSearch(): Promise<void> {
  store.setFilters({
    keyword: filterKeyword.value.trim() || undefined,
    tradeType: filterTradeType.value as TradeType | '',
    followPlan: followPlanToFilter(),
    mood: filterMood.value as Mood | '',
    ...dateRangeToFilter(),
  })
  await store.searchTrades()
  showStoreError()
}

async function handleReset(): Promise<void> {
  filterKeyword.value = ''
  filterTradeType.value = ''
  filterDateRange.value = null
  filterFollowPlan.value = ''
  filterMood.value = ''
  store.setFilters({
    keyword: '',
    tradeType: '',
    startDate: undefined,
    endDate: undefined,
    followPlan: '',
    mood: '',
  })
  await store.loadTrades()
  showStoreError()
}

function closeForms(): void {
  buyFormVisible.value = false
  sellFormVisible.value = false
  editingTrade.value = null
  editingBuyTrade.value = null
  editingSellTrade.value = null
}

function handleBuyFormVisibleUpdate(visible: boolean): void {
  buyFormVisible.value = visible

  if (!visible) {
    closeForms()
  }
}

function handleSellFormVisibleUpdate(visible: boolean): void {
  sellFormVisible.value = visible

  if (!visible) {
    closeForms()
  }
}

async function handleExport(): Promise<void> {
  try {
    const filePath = await save({
      title: '导出交易记录',
      defaultPath: `trades-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }],
    })
    if (!filePath) return

    exporting.value = true
    const csv = await exportTradesCsv()
    await writeTextFile(filePath, csv)
    message.success('已导出 CSV 文件，请到“下载”目录查看')
  } catch {
    message.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.trades-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trades-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.trades-page__title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0;
}

.trades-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.trades-page__actions,
.trades-page__filters {
  width: 100%;
}

.trades-page__filter-item {
  width: 220px;
  margin-bottom: 0;
}

.trades-page__select-item {
  width: 136px;
  margin-bottom: 0;
}

.trades-page__date-item {
  width: 240px;
  margin-bottom: 0;
}

.trades-page__button-item {
  margin-bottom: 0;
}
</style>
