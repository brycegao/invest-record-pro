/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
仓位详情抽屉 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See LICENSE file
in the project root for full license information. */

<template>
  <NDrawer
    v-model:show="innerVisible"
    placement="right"
    width="640"
    :show-close="true"
    :mask-closable="true"
  >
    <NDrawerContent :title="drawerTitle">
      <div v-if="!position">
        <NEmpty description="请选择一个快照查看明细" />
      </div>
      <div v-else>
        <NDescriptions :column="2" size="small" labelPlacement="left">
          <NDescriptionsItem label="快照日期">{{
            formatDate(position.snapshotAt)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="总资产">{{
            formatMoney(position.totalAssets)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="现金">{{ formatMoney(position.cash) }}</NDescriptionsItem>
          <NDescriptionsItem label="持仓市值">{{
            formatMoney(position.totalAssets - position.cash)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="浮动盈亏">{{
            formatSignedMoney(position.unrealizedPnl)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="已实现盈亏">{{
            formatSignedMoney(position.realizedPnl)
          }}</NDescriptionsItem>
        </NDescriptions>

        <div class="position-detail-drawer__table">
          <NDataTable
            :columns="columns"
            :data="items"
            :row-key="getRowKey"
            :render-empty="renderEmpty"
            size="small"
            bordered
            striped
          />
        </div>

        <div class="position-detail-drawer__footer">
          <NButton @click="handleClose">关闭</NButton>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import {
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { Position, PositionItem } from '@/domain/types'
import { fenToYuan, formatMoney, formatQuantity, formatSignedMoney } from '@/domain/types/financial'

const props = defineProps<{
  visible: boolean
  position: Position | null
  items: PositionItem[]
}>()

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void
}>()

const innerVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

const drawerTitle = computed(() => {
  if (!props.position) {
    return '仓位明细'
  }

  return `仓位明细 — ${formatDate(props.position.snapshotAt)}`
})

function formatDate(value: string): string {
  return value.slice(0, 10)
}

function formatRatio(item: PositionItem): string {
  if (!props.position || props.position.totalAssets === 0) {
    return '—'
  }

  const ratio = item.marketValue / props.position.totalAssets
  return `${(ratio * 100).toFixed(1)}%`
}

const columns: DataTableColumns<PositionItem> = [
  {
    title: '标的',
    key: 'asset',
    width: 160,
    render(row) {
      const label = `${row.assetCode ?? ''} ${row.assetName ?? ''}`.trim() || `#${row.assetId}`
      return label
    },
  },
  {
    title: '持仓数量',
    key: 'quantity',
    align: 'right',
    width: 100,
    render(row) {
      return formatQuantity(row.quantity)
    },
  },
  {
    title: '成本价',
    key: 'avgCost',
    align: 'right',
    width: 100,
    render(row) {
      return fenToYuan(row.avgCost).toFixed(2)
    },
  },
  {
    title: '当前价',
    key: 'currentPrice',
    align: 'right',
    width: 100,
    render(row) {
      return fenToYuan(row.currentPrice).toFixed(2)
    },
  },
  {
    title: '市值',
    key: 'marketValue',
    align: 'right',
    width: 120,
    render(row) {
      return formatMoney(row.marketValue)
    },
  },
  {
    title: '浮动盈亏',
    key: 'unrealizedPnl',
    align: 'right',
    width: 120,
    render(row) {
      return formatSignedMoney(row.unrealizedPnl)
    },
  },
  {
    title: '仓位占比',
    key: 'ratio',
    align: 'right',
    width: 100,
    render(row) {
      return formatRatio(row)
    },
  },
]

function getRowKey(row: PositionItem): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无仓位明细',
  })
}

function handleClose(): void {
  emit('update:visible', false)
}
</script>

<style scoped>
.position-detail-drawer__table {
  margin-top: 24px;
}

.position-detail-drawer__footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
}
</style>
