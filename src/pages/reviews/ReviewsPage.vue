<template>
  <div class="reviews-page">
    <div class="reviews-page__header">
      <div>
        <h2 class="reviews-page__title">交易复盘</h2>
        <p class="reviews-page__description">记录和反思每一笔交易</p>
      </div>
      <NButton type="primary" @click="handleCreate">+ 新增复盘</NButton>
    </div>

    <NSpace align="end" class="reviews-page__filters">
      <NFormItem label="标的搜索" class="reviews-page__filter-item">
        <NInput
          v-model:value="filterKeyword"
          placeholder="搜索标的代码或名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </NFormItem>

      <NFormItem label="交易日期" class="reviews-page__date-item">
        <NDatePicker
          v-model:value="dateRange"
          type="daterange"
          placeholder="选择日期范围"
          clearable
        />
      </NFormItem>

      <NFormItem label="结果" class="reviews-page__select-item">
        <NSelect
          v-model:value="filterResult"
          :options="resultOptions"
          placeholder="结果"
          clearable
        />
      </NFormItem>

      <NFormItem label="问题类型" class="reviews-page__select-item">
        <NSelect
          v-model:value="filterIssueType"
          :options="issueTypeOptions"
          placeholder="问题类型"
          clearable
        />
      </NFormItem>

      <NFormItem label=" " class="reviews-page__button-item">
        <NSpace>
          <NButton type="primary" :loading="store.isLoading" @click="handleSearch">搜索</NButton>
          <NButton :disabled="store.isLoading" @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NSpace>

    <ReviewTable
      :data="store.reviews"
      :loading="store.isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <ReviewForm
      :visible="formVisible"
      :review="selectedReview"
      :loading="store.isLoading"
      @update:visible="handleFormVisibleUpdate"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NDatePicker, NFormItem, NInput, NSelect, NSpace, useMessage } from 'naive-ui'
import { ReviewForm, ReviewTable } from '@/features/reviews/components'
import { useReviewStore } from '@/features/reviews/store'
import type { Review, ReviewCreatePayload, ReviewFilter } from '@/domain/types'
import {
  ISSUE_TYPE_LABELS,
  ISSUE_TYPES,
  REVIEW_RESULT_LABELS,
  REVIEW_RESULTS,
} from '@/domain/types'

const message = useMessage()
const route = useRoute()
const store = useReviewStore()

const formVisible = ref(false)
const selectedReview = ref<Review | null>(null)
const filterKeyword = ref('')
const dateRange = ref<[number, number] | null>(null)
const filterResult = ref<ReviewFilter['result']>('')
const filterIssueType = ref<ReviewFilter['issueType']>('')
const pendingTradeId = ref<number | null>(null)

const resultOptions = [
  { label: '全部', value: '' },
  ...REVIEW_RESULTS.map((result) => ({ label: REVIEW_RESULT_LABELS[result], value: result })),
]

const issueTypeOptions = [
  { label: '全部', value: '' },
  ...ISSUE_TYPES.map((issueType) => ({ label: ISSUE_TYPE_LABELS[issueType], value: issueType })),
]

onMounted(async () => {
  await store.loadReviews()
  showStoreError()

  // 检查 URL query 中的 tradeId（从交易记录跳转）
  const queryTradeId = route.query.tradeId
  if (queryTradeId) {
    const tradeId = Number(queryTradeId)
    if (Number.isFinite(tradeId) && tradeId > 0) {
      pendingTradeId.value = tradeId
      formVisible.value = true
    }
  }
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
    !!dateRange.value ||
    !!filterResult.value ||
    !!filterIssueType.value
  )
}

async function refreshReviews(): Promise<void> {
  if (hasActiveFilters()) {
    await handleSearch()
    return
  }

  await store.loadReviews()
}

function handleCreate(): void {
  selectedReview.value = null
  formVisible.value = true
}

function handleEdit(row: Review): void {
  selectedReview.value = row
  formVisible.value = true
}

async function handleDelete(row: Review): Promise<void> {
  await store.deleteReview(row.id)

  if (!showStoreError()) {
    message.success('删除成功')
  }
}

async function handleFormSubmit(data: ReviewCreatePayload): Promise<void> {
  if (selectedReview.value) {
    await store.updateReview({ ...data, id: selectedReview.value.id })
  } else {
    await store.createReview(data)
  }

  if (showStoreError()) {
    return
  }

  message.success(selectedReview.value ? '更新成功' : '创建成功')
  formVisible.value = false
  selectedReview.value = null
  pendingTradeId.value = null
  await refreshReviews()
}

async function handleSearch(): Promise<void> {
  const startDate = dateRange.value?.[0]
    ? new Date(dateRange.value[0]).toISOString().slice(0, 10)
    : undefined
  const endDate = dateRange.value?.[1]
    ? new Date(dateRange.value[1]).toISOString().slice(0, 10)
    : undefined

  store.setFilters({
    keyword: filterKeyword.value.trim() || undefined,
    startDate,
    endDate,
    result: filterResult.value,
    issueType: filterIssueType.value,
  })
  await store.searchReviews()
  showStoreError()
}

async function handleReset(): Promise<void> {
  filterKeyword.value = ''
  dateRange.value = null
  filterResult.value = ''
  filterIssueType.value = ''
  store.setFilters({ keyword: '', startDate: '', endDate: '', result: '', issueType: '' })
  await store.loadReviews()
  showStoreError()
}

function handleFormVisibleUpdate(visible: boolean): void {
  formVisible.value = visible

  if (!visible) {
    selectedReview.value = null
    pendingTradeId.value = null
  }
}
</script>

<style scoped>
.reviews-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reviews-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.reviews-page__title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0;
}

.reviews-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.reviews-page__filters {
  width: 100%;
}

.reviews-page__filter-item {
  width: 220px;
  margin-bottom: 0;
}

.reviews-page__date-item {
  width: 280px;
  margin-bottom: 0;
}

.reviews-page__select-item {
  width: 120px;
  margin-bottom: 0;
}

.reviews-page__button-item {
  margin-bottom: 0;
}
</style>
