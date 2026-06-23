/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
交易计划管理页面 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See LICENSE
file in the project root for full license information. */

<template>
  <div class="plans-page">
    <div class="plans-page__header">
      <div>
        <h2 class="plans-page__title">交易计划</h2>
        <p class="plans-page__description">创建和管理你的买入/卖出计划</p>
      </div>
    </div>

    <NSpace class="plans-page__actions">
      <NButton type="primary" @click="handleCreate('buy')">+ 新增买入计划</NButton>
      <NButton type="primary" secondary @click="handleCreate('sell')">+ 新增卖出计划</NButton>
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton disabled>导出</NButton>
        </template>
        功能开发中
      </NTooltip>
    </NSpace>

    <NSpace align="end" class="plans-page__filters">
      <NFormItem label="标的" class="plans-page__filter-item">
        <NInput
          v-model:value="filterKeyword"
          placeholder="搜索代码或名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </NFormItem>

      <NFormItem label="计划类型" class="plans-page__select-item">
        <NSelect v-model:value="filterPlanType" :options="planTypeOptions" />
      </NFormItem>

      <NFormItem label="状态" class="plans-page__select-item">
        <NSelect v-model:value="filterStatus" :options="statusOptions" />
      </NFormItem>

      <NFormItem label="日期范围" class="plans-page__date-item">
        <NDatePicker v-model:value="filterDateRange" type="daterange" clearable />
      </NFormItem>

      <NFormItem label=" " class="plans-page__button-item">
        <NSpace>
          <NButton type="primary" :loading="store.isLoading" @click="handleSearch">搜索</NButton>
          <NButton :disabled="store.isLoading" @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NSpace>

    <PlanTable
      :data="store.plans"
      :loading="store.isLoading"
      @edit="handleEdit"
      @cancel="handleCancelPlan"
      @delete="handleDelete"
    />

    <PlanForm
      :visible="formVisible"
      :plan="selectedPlan"
      :plan-type="formPlanType"
      :rules="store.currentPlanRules"
      :loading="store.isLoading"
      @update:visible="handleFormVisibleUpdate"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import {
  NButton,
  NDatePicker,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { PlanForm, PlanTable } from '@/features/plans/components'
import { usePlanStore } from '@/features/plans/store'
import type { Plan, PlanCreatePayload, PlanFilter, PlanType } from '@/domain/types'
import { PLAN_STATUS_LABELS, PLAN_STATUSES, PLAN_TYPE_LABELS, PLAN_TYPES } from '@/domain/types'

const message = useMessage()
const store = usePlanStore()

const formVisible = ref(false)
const selectedPlan = ref<Plan | null>(null)
const formPlanType = ref<PlanType>('buy')
const filterKeyword = ref('')
const filterPlanType = ref<PlanFilter['planType']>('')
const filterStatus = ref<PlanFilter['status']>('')
const filterDateRange = ref<[number, number] | null>(null)

const planTypeOptions = [
  { label: '全部', value: '' },
  ...PLAN_TYPES.map((planType) => ({ label: PLAN_TYPE_LABELS[planType], value: planType })),
]

const statusOptions = [
  { label: '全部', value: '' },
  ...PLAN_STATUSES.map((status) => ({ label: PLAN_STATUS_LABELS[status], value: status })),
]

onMounted(async () => {
  await store.loadPlans()
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
    !!filterPlanType.value ||
    !!filterStatus.value ||
    !!filterDateRange.value
  )
}

async function refreshPlans(): Promise<void> {
  if (hasActiveFilters()) {
    await handleSearch()
    return
  }

  await store.loadPlans()
}

function dateRangeToFilter(): Pick<PlanFilter, 'startDate' | 'endDate'> {
  if (!filterDateRange.value) {
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }

  return {
    startDate: dayjs(filterDateRange.value[0]).format('YYYY-MM-DD'),
    endDate: dayjs(filterDateRange.value[1]).format('YYYY-MM-DD'),
  }
}

function handleCreate(planType: PlanType): void {
  selectedPlan.value = null
  formPlanType.value = planType
  store.currentPlanRules = []
  formVisible.value = true
}

async function handleEdit(row: Plan): Promise<void> {
  selectedPlan.value = row
  formPlanType.value = row.planType
  await store.loadPlanRules(row.id)

  if (!showStoreError()) {
    formVisible.value = true
  }
}

async function handleCancelPlan(row: Plan): Promise<void> {
  await store.updatePlanStatus(row.id, 'canceled')

  if (!showStoreError()) {
    message.success('计划已作废')
    await refreshPlans()
  }
}

async function handleDelete(row: Plan): Promise<void> {
  await store.deletePlan(row.id)

  if (!showStoreError()) {
    message.success('删除成功')
  }
}

async function handleFormSubmit(data: PlanCreatePayload): Promise<void> {
  if (selectedPlan.value) {
    await store.updatePlan({
      ...data,
      id: selectedPlan.value.id,
      status: selectedPlan.value.status,
    })
  } else {
    await store.createPlan({
      ...data,
      status: 'pending',
    })
  }

  if (showStoreError()) {
    return
  }

  message.success(selectedPlan.value ? '更新成功' : '创建成功')
  formVisible.value = false
  selectedPlan.value = null
  await refreshPlans()
}

async function handleSearch(): Promise<void> {
  store.setFilters({
    keyword: filterKeyword.value.trim() || undefined,
    planType: filterPlanType.value,
    status: filterStatus.value,
    ...dateRangeToFilter(),
  })
  await store.searchPlans()
  showStoreError()
}

async function handleReset(): Promise<void> {
  filterKeyword.value = ''
  filterPlanType.value = ''
  filterStatus.value = ''
  filterDateRange.value = null
  store.setFilters({
    keyword: '',
    planType: '',
    status: '',
    startDate: undefined,
    endDate: undefined,
  })
  await store.loadPlans()
  showStoreError()
}

function handleFormVisibleUpdate(visible: boolean): void {
  formVisible.value = visible

  if (!visible) {
    selectedPlan.value = null
    store.currentPlanRules = []
  }
}
</script>

<style scoped>
.plans-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plans-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.plans-page__title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0;
}

.plans-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.plans-page__actions,
.plans-page__filters {
  width: 100%;
}

.plans-page__filter-item {
  width: 220px;
  margin-bottom: 0;
}

.plans-page__select-item {
  width: 136px;
  margin-bottom: 0;
}

.plans-page__date-item {
  width: 240px;
  margin-bottom: 0;
}

.plans-page__button-item {
  margin-bottom: 0;
}
</style>
