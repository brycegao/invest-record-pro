<template>
  <div class="market-observations-page">
    <div class="market-observations-page__header">
      <div>
        <h2 class="market-observations-page__title">市场观察</h2>
        <p class="market-observations-page__description">记录市场环境和你的判断</p>
      </div>
      <NButton type="primary" @click="handleCreate">+ 新增观察</NButton>
    </div>

    <NSpace align="end" class="market-observations-page__filters">
      <NFormItem label="日期范围" class="market-observations-page__date-item">
        <NDatePicker
          v-model:value="dateRange"
          type="daterange"
          placeholder="选择日期范围"
          clearable
        />
      </NFormItem>

      <NFormItem label="市场情绪" class="market-observations-page__select-item">
        <NSelect
          v-model:value="filterSentiment"
          :options="sentimentOptions"
          placeholder="情绪"
          clearable
        />
      </NFormItem>

      <NFormItem label=" " class="market-observations-page__button-item">
        <NSpace>
          <NButton type="primary" :loading="store.isLoading" @click="handleSearch">搜索</NButton>
          <NButton :disabled="store.isLoading" @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NSpace>

    <MarketObservationTable
      :data="store.observations"
      :loading="store.isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <MarketObservationForm
      :visible="formVisible"
      :observation="selectedObservation"
      :loading="store.isLoading"
      @update:visible="handleFormVisibleUpdate"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NDatePicker, NFormItem, NSelect, NSpace, useMessage } from 'naive-ui'
import {
  MarketObservationForm,
  MarketObservationTable,
} from '@/features/market-observations/components'
import { useMarketObservationStore } from '@/features/market-observations/store'
import type {
  MarketObservation,
  MarketObservationCreatePayload,
  MarketObservationFilter,
} from '@/domain/types'
import { SENTIMENT_LABELS, SENTIMENTS } from '@/domain/types'

const message = useMessage()
const store = useMarketObservationStore()

const formVisible = ref(false)
const selectedObservation = ref<MarketObservation | null>(null)
const dateRange = ref<[number, number] | null>(null)
const filterSentiment = ref<MarketObservationFilter['sentiment']>('')
const sentimentOptions = [
  { label: '全部', value: '' },
  ...SENTIMENTS.map((s) => ({ label: SENTIMENT_LABELS[s], value: s })),
]

onMounted(async () => {
  await store.loadObservations()
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
  return !!dateRange.value || !!filterSentiment.value
}

async function refreshObservations(): Promise<void> {
  if (hasActiveFilters()) {
    await handleSearch()
    return
  }

  await store.loadObservations()
}

function handleCreate(): void {
  selectedObservation.value = null
  formVisible.value = true
}

function handleEdit(row: MarketObservation): void {
  selectedObservation.value = row
  formVisible.value = true
}

async function handleDelete(row: MarketObservation): Promise<void> {
  await store.deleteObservation(row.id)

  if (!showStoreError()) {
    message.success('删除成功')
  }
}

async function handleFormSubmit(data: MarketObservationCreatePayload): Promise<void> {
  if (selectedObservation.value) {
    await store.updateObservation({ ...data, id: selectedObservation.value.id })
  } else {
    await store.createObservation(data)
  }

  if (showStoreError()) {
    return
  }

  message.success(selectedObservation.value ? '更新成功' : '创建成功')
  formVisible.value = false
  selectedObservation.value = null
  await refreshObservations()
}

async function handleSearch(): Promise<void> {
  const startDate = dateRange.value?.[0]
    ? new Date(dateRange.value[0]).toISOString().slice(0, 10)
    : undefined
  const endDate = dateRange.value?.[1]
    ? new Date(dateRange.value[1]).toISOString().slice(0, 10)
    : undefined

  store.setFilters({
    startDate,
    endDate,
    sentiment: filterSentiment.value,
  })
  await store.searchObservations()
  showStoreError()
}

async function handleReset(): Promise<void> {
  dateRange.value = null
  filterSentiment.value = ''
  store.setFilters({ startDate: '', endDate: '', sentiment: '' })
  await store.loadObservations()
  showStoreError()
}

function handleFormVisibleUpdate(visible: boolean): void {
  formVisible.value = visible

  if (!visible) {
    selectedObservation.value = null
  }
}
</script>

<style scoped>
.market-observations-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.market-observations-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.market-observations-page__title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0;
}

.market-observations-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.market-observations-page__filters {
  width: 100%;
}

.market-observations-page__date-item {
  width: 280px;
  margin-bottom: 0;
}

.market-observations-page__select-item {
  width: 120px;
  margin-bottom: 0;
}

.market-observations-page__button-item {
  margin-bottom: 0;
}
</style>
