<template>
  <div class="positions-page">
    <div class="positions-page__header">
      <div>
        <h2 class="positions-page__title">仓位快照</h2>
        <p class="positions-page__description">查看历史仓位快照，并生成最新持仓数据</p>
      </div>
      <NButton type="primary" @click="handleOpenCreate">+ 生成快照</NButton>
    </div>

    <n-grid cols="4" x-gap="16" y-gap="16" class="positions-page__summary">
      <n-grid-item>
        <n-card>
          <n-statistic label="总资产" :value="formatMoney(latestSnapshot.totalAssets)" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="现金" :value="formatMoney(latestSnapshot.cash)" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic
            label="浮动盈亏"
            :value="formatSignedMoney(latestSnapshot.unrealizedPnl)"
            :value-style="{ color: getMoneyColor(latestSnapshot.unrealizedPnl) }"
          />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic
            label="已实现盈亏"
            :value="formatSignedMoney(latestSnapshot.realizedPnl)"
            :value-style="{ color: getMoneyColor(latestSnapshot.realizedPnl) }"
          />
        </n-card>
      </n-grid-item>
    </n-grid>

    <NSpace align="end" class="positions-page__filters">
      <NFormItem label="日期范围" class="positions-page__filter-item">
        <NDatePicker v-model:value="dateRange" type="daterange" placeholder="请选择日期范围" />
      </NFormItem>
      <NFormItem label=" " class="positions-page__button-item">
        <NSpace>
          <NButton type="primary" :loading="store.isLoading" @click="handleSearch">搜索</NButton>
          <NButton :disabled="store.isLoading" @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NSpace>

    <NDataTable
      :columns="columns"
      :data="filteredPositions"
      :loading="store.isLoading"
      :pagination="{ pageSize: 20 }"
      :render-empty="renderEmpty"
      :row-key="getRowKey"
      size="small"
      striped
    />

    <PositionDetailDrawer
      :visible="detailDrawerVisible"
      :position="selectedPosition"
      :items="store.currentPositionItems"
      @update:visible="detailDrawerVisible = $event"
    />

    <CreateSnapshotDrawer
      :visible="createDrawerVisible"
      @update:visible="createDrawerVisible = $event"
      @submit="handleCreateSnapshot"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import { h } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NEmpty,
  NFormItem,
  NGrid,
  NGridItem,
  NPopconfirm,
  NStatistic,
  NSpace,
} from 'naive-ui'
import { usePositionStore } from '@/features/positions/store'
import { CreateSnapshotDrawer, PositionDetailDrawer } from '@/features/positions/components'
import type { Position, PositionCreatePayload } from '@/domain/types'
import { formatMoney, formatSignedMoney, getMoneyColor } from '@/domain/types/financial'

const message = useMessage()
const store = usePositionStore()
const detailDrawerVisible = ref(false)
const createDrawerVisible = ref(false)
const selectedPosition = ref<Position | null>(null)
const dateRange = ref<[number, number] | null>(null)

const latestSnapshot = computed(
  () =>
    store.latestPosition ?? {
      id: 0,
      snapshotAt: '',
      cash: 0,
      totalAssets: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
      createdAt: '',
      updatedAt: '',
    },
)

const filteredPositions = computed(() => {
  if (!dateRange.value) {
    return store.positions
  }

  const start = dayjs(dateRange.value[0]).startOf('day')
  const end = dayjs(dateRange.value[1]).endOf('day')

  return store.positions.filter((position) => {
    const snapshotAt = dayjs(position.snapshotAt)
    return (
      (snapshotAt.isAfter(start) || snapshotAt.isSame(start)) &&
      (snapshotAt.isBefore(end) || snapshotAt.isSame(end))
    )
  })
})

function showStoreError(): boolean {
  if (store.error) {
    message.error(store.error)
    return true
  }

  return false
}

async function loadInitialData(): Promise<void> {
  await store.loadPositions()
  await store.loadLatestPosition()
  showStoreError()
}

onMounted(loadInitialData)

function handleOpenCreate(): void {
  createDrawerVisible.value = true
}

async function handleView(row: Position): Promise<void> {
  selectedPosition.value = row
  await store.loadPositionItems(row.id)
  if (!showStoreError()) {
    detailDrawerVisible.value = true
  }
}

async function handleDelete(row: Position): Promise<void> {
  await store.deletePosition(row.id)
  if (!showStoreError()) {
    message.success('删除成功')
  }
}

function handleSearch(): void {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    message.warning('请选择日期范围后再搜索')
  }
}

function handleReset(): void {
  dateRange.value = null
}

async function handleCreateSnapshot(payload: PositionCreatePayload): Promise<void> {
  await store.createSnapshot(payload)

  if (!showStoreError()) {
    createDrawerVisible.value = false
    message.success('仓位快照已生成')
  }
}

const columns = [
  {
    title: '快照时间',
    key: 'snapshotAt',
    width: 170,
    render(row: Position) {
      return dayjs(row.snapshotAt).format('YYYY-MM-DD')
    },
  },
  {
    title: '现金',
    key: 'cash',
    align: 'right' as const,
    width: 120,
    render(row: Position) {
      return formatMoney(row.cash)
    },
  },
  {
    title: '总资产',
    key: 'totalAssets',
    align: 'right' as const,
    width: 130,
    render(row: Position) {
      return formatMoney(row.totalAssets)
    },
  },
  {
    title: '浮动盈亏',
    key: 'unrealizedPnl',
    align: 'right' as const,
    width: 130,
    render(row: Position) {
      return formatSignedMoney(row.unrealizedPnl)
    },
  },
  {
    title: '已实现盈亏',
    key: 'realizedPnl',
    align: 'right' as const,
    width: 130,
    render(row: Position) {
      return formatSignedMoney(row.realizedPnl)
    },
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center' as const,
    width: 120,
    render(row: Position) {
      return h(
        NSpace,
        {
          justify: 'center',
          size: 8,
        },
        {
          default: () => [
            h(
              NButton,
              {
                tertiary: true,
                size: 'tiny',
                onClick: () => handleView(row),
              },
              { default: () => '查看明细' },
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row),
              },
              {
                default: () => '确认删除该快照吗？此操作不可恢复。',
                trigger: () =>
                  h(
                    NButton,
                    {
                      secondary: true,
                      size: 'tiny',
                      type: 'error',
                    },
                    { default: () => '删除' },
                  ),
              },
            ),
          ],
        },
      )
    },
  },
]

function getRowKey(row: Position): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无仓位快照',
  })
}
</script>

<style scoped>
.positions-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.positions-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.positions-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.positions-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.positions-page__summary {
  width: 100%;
}

.positions-page__filters {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.positions-page__filter-item {
  min-width: 320px;
}

.positions-page__button-item {
  display: flex;
  align-items: center;
}
</style>
