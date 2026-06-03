/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 复盘评价列表表格
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <NDataTable
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="{ pageSize: 20 }"
    :render-empty="renderEmpty"
    :row-key="getRowKey"
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
import type { IssueType, Review, ReviewResult } from '@/domain/types'
import { ISSUE_TYPE_LABELS, REVIEW_RESULT_LABELS, TRADE_TYPE_LABELS } from '@/domain/types'

interface Props {
  data: Review[]
  loading: boolean
}

interface Emits {
  (event: 'edit', row: Review): void
  (event: 'delete', row: Review): void
}

defineProps<Props>()

const emit = defineEmits<Emits>()

const resultTagType: Record<ReviewResult, 'success' | 'error' | 'warning'> = {
  good: 'success',
  bad: 'error',
  neutral: 'warning',
}

const issueTypeTagType: Record<IssueType, 'warning' | 'info' | 'error' | 'default'> = {
  emotion: 'warning',
  rule: 'info',
  discipline: 'error',
  external: 'default',
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

function formatTradeInfo(row: Review): string {
  const code = row.tradeAssetCode ?? '—'
  const type = row.tradeType
    ? (TRADE_TYPE_LABELS[row.tradeType as keyof typeof TRADE_TYPE_LABELS] ?? row.tradeType)
    : '—'
  const date = row.tradeCreatedAt ? dayjs(row.tradeCreatedAt).format('YYYY-MM-DD') : ''
  return `${code} ${type}${date ? ` ${date}` : ''}`
}

const columns: DataTableColumns<Review> = [
  {
    title: '复盘时间',
    key: 'createdAt',
    width: 170,
    render(row) {
      return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')
    },
  },
  {
    title: '交易信息',
    key: 'tradeInfo',
    width: 200,
    render(row) {
      return h('span', { style: { fontSize: '13px' } }, formatTradeInfo(row))
    },
  },
  {
    title: '交易结果',
    key: 'result',
    align: 'center' as const,
    width: 90,
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: resultTagType[row.result],
        },
        { default: () => REVIEW_RESULT_LABELS[row.result] },
      )
    },
  },
  {
    title: '问题类型',
    key: 'issueType',
    align: 'center' as const,
    width: 90,
    render(row) {
      if (!row.issueType) {
        return h('span', { style: { color: '#9ca3af' } }, '—')
      }

      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: issueTypeTagType[row.issueType],
        },
        { default: () => ISSUE_TYPE_LABELS[row.issueType as IssueType] },
      )
    },
  },
  {
    title: '总结',
    key: 'summary',
    render(row) {
      return h(
        'span',
        {
          title: row.summary,
          style: { fontSize: '13px' },
        },
        truncateText(row.summary, 50),
      )
    },
  },
  {
    title: '改进点',
    key: 'improve',
    render(row) {
      if (!row.improve) {
        return h('span', { style: { color: '#9ca3af' } }, '—')
      }

      return h(
        'span',
        {
          title: row.improve,
          style: { fontSize: '13px' },
        },
        truncateText(row.improve, 50),
      )
    },
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center' as const,
    width: 100,
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
                default: () => '确认删除该复盘记录吗？',
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

function getRowKey(row: Review): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无复盘记录',
  })
}
</script>
