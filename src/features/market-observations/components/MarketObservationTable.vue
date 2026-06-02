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
import { NButton, NEmpty, NPopconfirm, NSpace, NTag } from 'naive-ui'
import type { MarketObservation, Sentiment } from '@/domain/types'
import { SENTIMENT_LABELS } from '@/domain/types'
import { formatIndexPoint, formatMoney } from '@/domain/types/financial'

interface Props {
  data: MarketObservation[]
  loading: boolean
}

interface Emits {
  (event: 'edit', row: MarketObservation): void
  (event: 'delete', row: MarketObservation): void
}

defineProps<Props>()

const emit = defineEmits<Emits>()

const sentimentTagType: Partial<Record<Sentiment, 'error' | 'warning' | 'info' | 'success'>> = {
  极低: 'error',
  低: 'warning',
  中: 'info',
  高: 'success',
  极高: 'success',
}

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

function formatOptionalIndex(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return formatIndexPoint(value)
}

function formatOptionalMoney(value: number | null): string {
  if (value === null) {
    return '—'
  }

  return formatMoney(value)
}

const columns: DataTableColumns<MarketObservation> = [
  {
    title: '观察时间',
    key: 'observeAt',
    width: 170,
    render(row) {
      return dayjs(row.observeAt).format('YYYY-MM-DD HH:mm')
    },
  },
  {
    title: '上证指数',
    key: 'shanghaiIndex',
    align: 'right' as const,
    width: 110,
    render(row) {
      return formatOptionalIndex(row.shanghaiIndex)
    },
  },
  {
    title: '上证50',
    key: 'sse50Index',
    align: 'right' as const,
    width: 110,
    render(row) {
      return formatOptionalIndex(row.sse50Index)
    },
  },
  {
    title: '沪深300',
    key: 'csi300Index',
    align: 'right' as const,
    width: 110,
    render(row) {
      return formatOptionalIndex(row.csi300Index)
    },
  },
  {
    title: '成交额',
    key: 'marketTurnover',
    align: 'right' as const,
    width: 120,
    render(row) {
      return formatOptionalMoney(row.marketTurnover)
    },
  },
  {
    title: '市场情绪',
    key: 'sentiment',
    align: 'center' as const,
    width: 90,
    render(row) {
      if (!row.sentiment) {
        return h('span', { style: { color: '#9ca3af' } }, '—')
      }

      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: sentimentTagType[row.sentiment] as 'error' | 'warning' | 'info' | 'success',
        },
        { default: () => SENTIMENT_LABELS[row.sentiment as Sentiment] },
      )
    },
  },
  {
    title: '政策事件',
    key: 'policyEvent',
    render(row) {
      if (!row.policyEvent) {
        return h('span', { style: { color: '#9ca3af' } }, '—')
      }

      return h(
        'span',
        { title: row.policyEvent, style: { fontSize: '13px' } },
        truncateText(row.policyEvent, 40),
      )
    },
  },
  {
    title: '宏观备注',
    key: 'macroNote',
    render(row) {
      if (!row.macroNote) {
        return h('span', { style: { color: '#9ca3af' } }, '—')
      }

      return h(
        'span',
        { title: row.macroNote, style: { fontSize: '13px' } },
        truncateText(row.macroNote, 40),
      )
    },
  },
  {
    title: '个人观点',
    key: 'personalView',
    render(row) {
      if (!row.personalView) {
        return h('span', { style: { color: '#9ca3af' } }, '—')
      }

      return h(
        'span',
        { title: row.personalView, style: { fontSize: '13px' } },
        truncateText(row.personalView, 40),
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
                default: () => '确认删除该观察记录吗？',
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

function getRowKey(row: MarketObservation): number {
  return row.id
}

function renderEmpty() {
  return h(NEmpty, {
    description: '暂无市场观察记录',
  })
}
</script>
