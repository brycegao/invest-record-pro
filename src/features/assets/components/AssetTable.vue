/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
投资标的列表表格 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See LICENSE
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
import { NButton, NDataTable, NEmpty, NPopconfirm, NRate, NSpace, NTag } from 'naive-ui'
import type { Asset, AssetType } from '@/domain/types'
import { ASSET_TYPE_LABELS, MARKET_LABELS } from '@/domain/types'

interface Props {
  data: Asset[]
  loading: boolean
}

interface Emits {
  (event: 'edit', row: Asset): void
  (event: 'delete', row: Asset): void
}

defineProps<Props>()

const emit = defineEmits<Emits>()

const typeTagColor: Record<AssetType, 'default' | 'success' | 'info' | 'warning'> = {
  stock: 'default',
  etf: 'success',
  fund: 'info',
  index: 'warning',
  bond: 'default',
}

const columns: DataTableColumns<Asset> = [
  {
    title: '代码',
    key: 'code',
    width: 100,
    sorter: 'default',
  },
  {
    title: '名称',
    key: 'name',
    width: 150,
    sorter: 'default',
  },
  {
    title: '类型',
    key: 'type',
    align: 'center',
    width: 80,
    sorter: 'default',
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: typeTagColor[row.type],
        },
        { default: () => ASSET_TYPE_LABELS[row.type] },
      )
    },
  },
  {
    title: '市场',
    key: 'market',
    align: 'center',
    width: 80,
    sorter: 'default',
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
        },
        { default: () => MARKET_LABELS[row.market] },
      )
    },
  },
  {
    title: '风险等级',
    key: 'riskLevel',
    align: 'center',
    width: 90,
    sorter: 'default',
    render(row) {
      return h(NRate, {
        count: 5,
        readonly: true,
        size: 'small',
        value: row.riskLevel,
      })
    },
  },
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
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 120,
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
              NPopconfirm,
              {
                onPositiveClick: () => emit('delete', row),
              },
              {
                default: () => '确认删除该资产吗？删除后关联的计划和交易记录也将被删除。',
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

function getRowKey(row: Asset): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无投资标的',
  })
}
</script>

<style scoped>
:deep(.n-rate) {
  --n-item-size: 14px;
}
</style>
