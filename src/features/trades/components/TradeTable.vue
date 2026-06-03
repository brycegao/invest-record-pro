/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易记录列表表格
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <div class="trade-table">
    <NSpace justify="end" class="trade-table__toolbar">
      <NPopover trigger="click" placement="bottom-end">
        <template #trigger>
          <NButton size="small" secondary>列显示</NButton>
        </template>
        <NCheckboxGroup v-model:value="visibleOptionalColumns">
          <NSpace vertical>
            <NCheckbox value="fee">手续费</NCheckbox>
            <NCheckbox value="mood">情绪</NCheckbox>
          </NSpace>
        </NCheckboxGroup>
      </NPopover>
    </NSpace>

    <NDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="{ pageSize: 20 }"
      :render-empty="renderEmpty"
      :row-key="getRowKey"
      :scroll-x="1320"
      :default-sort="{ key: 'tradeAt', order: 'descend' }"
      size="small"
      striped
      :bordered="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import dayjs from 'dayjs'
import type { DataTableColumns } from 'naive-ui'
import {
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NEmpty,
  NPopover,
  NPopconfirm,
  NSpace,
  NTag,
  NText,
} from 'naive-ui'
import type { Trade, TradeType } from '@/domain/types'
import { MOOD_LABELS, TRADE_TYPE_LABELS } from '@/domain/types'
import {
  fenToYuan,
  formatMoney,
  formatQuantity,
  formatSignedMoney,
  getMoneyColor,
} from '@/domain/types/financial'

interface Props {
  data: Trade[]
  loading: boolean
  hiddenColumns?: string[]
}

interface Emits {
  (event: 'edit', row: Trade): void
  (event: 'review', row: Trade): void
  (event: 'delete', row: Trade): void
}

const props = withDefaults(defineProps<Props>(), {
  hiddenColumns: () => ['fee', 'mood'],
})

const emit = defineEmits<Emits>()

const visibleOptionalColumns = ref(
  ['fee', 'mood'].filter((column) => !props.hiddenColumns.includes(column)),
)

const tradeTypeTagType: Record<TradeType, 'success' | 'error'> = {
  buy: 'success',
  sell: 'error',
}

const columns = computed<DataTableColumns<Trade>>(() => {
  const nextColumns: DataTableColumns<Trade> = [
    {
      title: '成交时间',
      key: 'tradeAt',
      width: 170,
      sorter: 'default',
      render(row) {
        return dayjs(row.tradeAt).format('YYYY-MM-DD HH:mm')
      },
    },
    {
      title: '标的',
      key: 'asset',
      width: 120,
      render(row) {
        if (row.assetCode || row.assetName) {
          return `${row.assetCode ?? ''} ${row.assetName ?? ''}`.trim()
        }

        return `#${row.assetId}`
      },
    },
    {
      title: '类型',
      key: 'tradeType',
      align: 'center',
      width: 60,
      sorter: 'default',
      render(row) {
        return h(
          NTag,
          {
            bordered: false,
            size: 'small',
            type: tradeTypeTagType[row.tradeType],
          },
          { default: () => TRADE_TYPE_LABELS[row.tradeType] },
        )
      },
    },
    {
      title: '价格',
      key: 'price',
      align: 'right',
      width: 100,
      sorter: 'default',
      render(row) {
        return fenToYuan(row.price).toFixed(2)
      },
    },
    {
      title: '数量',
      key: 'quantity',
      align: 'right',
      width: 100,
      sorter: 'default',
      render(row) {
        return formatQuantity(row.quantity)
      },
    },
    {
      title: '总金额',
      key: 'totalAmount',
      align: 'right',
      width: 120,
      sorter: 'default',
      render(row) {
        return formatMoney(row.totalAmount)
      },
    },
    {
      title: '已实现盈亏',
      key: 'realizedPnl',
      align: 'right',
      width: 120,
      sorter(rowA, rowB) {
        return (rowA.realizedPnl ?? 0) - (rowB.realizedPnl ?? 0)
      },
      render(row) {
        if (row.tradeType === 'buy' || row.realizedPnl === null || row.realizedPnl === undefined) {
          return h(NText, { depth: 3 }, { default: () => '—' })
        }

        return h(
          'span',
          {
            class: getMoneyColor(row.realizedPnl),
          },
          formatSignedMoney(row.realizedPnl),
        )
      },
    },
    {
      title: '关联计划',
      key: 'planStatus',
      align: 'center',
      width: 100,
      render(row) {
        return row.planStatus ?? '—'
      },
    },
    {
      title: '遵守计划',
      key: 'followPlan',
      align: 'center',
      width: 90,
      sorter: 'default',
      render(row) {
        return h(
          NTag,
          {
            bordered: false,
            size: 'small',
            type: row.followPlan ? 'success' : 'error',
          },
          { default: () => (row.followPlan ? '是' : '否') },
        )
      },
    },
  ]

  if (visibleOptionalColumns.value.includes('fee')) {
    nextColumns.push({
      title: '手续费',
      key: 'fee',
      align: 'right',
      width: 90,
      render(row) {
        return formatMoney(row.fee)
      },
    })
  }

  if (visibleOptionalColumns.value.includes('mood')) {
    nextColumns.push({
      title: '情绪',
      key: 'mood',
      align: 'center',
      width: 80,
      render(row) {
        return row.mood ? MOOD_LABELS[row.mood] : '—'
      },
    })
  }

  nextColumns.push({
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 140,
    fixed: 'right',
    render(row) {
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
                secondary: true,
                size: 'tiny',
                onClick: () => emit('edit', row),
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                secondary: true,
                size: 'tiny',
                onClick: () => emit('review', row),
              },
              { default: () => '复盘' },
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => emit('delete', row),
              },
              {
                default: () => '确认删除该交易记录吗？关联复盘也会被删除。',
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
  })

  return nextColumns
})

function getRowKey(row: Trade): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无交易记录',
  })
}
</script>

<style scoped>
.trade-table__toolbar {
  margin-bottom: 8px;
}

:deep(.money-positive) {
  color: #16a34a;
}

:deep(.money-negative) {
  color: #dc2626;
}

:deep(.money-zero) {
  color: #6b7280;
}
</style>
