/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
交易计划列表表格 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See LICENSE
file in the project root for full license information. */

<template>
  <NDataTable
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="{ pageSize: 20 }"
    :render-empty="renderEmpty"
    :row-key="getRowKey"
    :default-sort="{ key: 'createdAt', order: 'descend' }"
    size="small"
    striped
    :bordered="false"
  />
</template>

<script setup lang="ts">
import { h } from 'vue'
import dayjs from 'dayjs'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable, NEmpty, NPopconfirm, NSpace, NTag } from 'naive-ui'
import type { Plan, PlanStatus, PlanType } from '@/domain/types'
import { PLAN_STATUS_LABELS, PLAN_TYPE_LABELS } from '@/domain/types'
import { formatPercent } from '@/domain/types/financial'

interface Props {
  data: Plan[]
  loading: boolean
}

interface Emits {
  (event: 'edit', row: Plan): void
  (event: 'cancel', row: Plan): void
  (event: 'delete', row: Plan): void
}

defineProps<Props>()

const emit = defineEmits<Emits>()

const statusTagType: Record<PlanStatus, 'default' | 'success' | 'info' | 'warning'> = {
  pending: 'info',
  partial: 'warning',
  completed: 'success',
  canceled: 'default',
}

const planTypeTagType: Record<PlanType, 'success' | 'error'> = {
  buy: 'success',
  sell: 'error',
}

const columns: DataTableColumns<Plan> = [
  {
    title: '创建时间',
    key: 'createdAt',
    width: 170,
    sorter: 'default',
    render(row) {
      return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')
    },
  },
  {
    title: '标的',
    key: 'asset',
    width: 140,
    render(row) {
      if (row.assetCode || row.assetName) {
        return `${row.assetCode ?? ''} ${row.assetName ?? ''}`.trim()
      }

      return `#${row.assetId}`
    },
  },
  {
    title: '类型',
    key: 'planType',
    align: 'center',
    width: 70,
    sorter: 'default',
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: planTypeTagType[row.planType],
        },
        { default: () => PLAN_TYPE_LABELS[row.planType] },
      )
    },
  },
  {
    title: '计划仓位',
    key: 'positionPercent',
    align: 'right',
    width: 100,
    render(row) {
      return row.positionPercent === null ? '-' : formatPercent(row.positionPercent)
    },
  },
  {
    title: '状态',
    key: 'status',
    align: 'center',
    width: 100,
    sorter: 'default',
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: statusTagType[row.status],
        },
        { default: () => PLAN_STATUS_LABELS[row.status] },
      )
    },
  },
  {
    title: '有效期',
    key: 'dateRange',
    align: 'center',
    width: 200,
    sorter(rowA, rowB) {
      return (rowA.startDate ?? '').localeCompare(rowB.startDate ?? '')
    },
    render(row) {
      const startDate = row.startDate ? dayjs(row.startDate).format('YYYY-MM-DD') : '不限'
      const endDate = row.endDate ? dayjs(row.endDate).format('YYYY-MM-DD') : '不限'
      return `${startDate} ~ ${endDate}`
    },
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 140,
    render(row) {
      return h(
        NSpace,
        {
          justify: 'center',
          size: 8,
        },
        {
          default: () => renderActions(row),
        },
      )
    },
  },
]

function renderActions(row: Plan) {
  const actions = []

  if (row.status === 'pending' || row.status === 'partial') {
    actions.push(
      h(
        NButton,
        {
          secondary: true,
          size: 'tiny',
          onClick: () => emit('edit', row),
        },
        { default: () => '编辑' },
      ),
    )
  }

  if (row.status === 'pending') {
    actions.push(
      h(
        NButton,
        {
          secondary: true,
          size: 'tiny',
          type: 'warning',
          onClick: () => emit('cancel', row),
        },
        { default: () => '作废' },
      ),
    )
  }

  actions.push(
    h(
      NPopconfirm,
      {
        onPositiveClick: () => emit('delete', row),
      },
      {
        default: () => '确认删除该交易计划吗？关联规则也会被删除。',
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
  )

  return actions
}

function getRowKey(row: Plan): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无交易计划',
  })
}
</script>
