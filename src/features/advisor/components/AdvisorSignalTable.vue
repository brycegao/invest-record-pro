<!--
  @Description: 推荐列表 — 含复盘按钮，触发 FollowUpDrawer
-->
<template>
  <NCard title="推荐列表" size="small">
    <NDataTable
      :columns="columns"
      :data="signals"
      :loading="loading"
      :pagination="{ pageSize: 15 }"
      size="small"
    />
  </NCard>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NCard, NDataTable, NTag, type DataTableColumns } from 'naive-ui'
import type { AdvisorSignal } from '@/domain/types'
import { ADVISOR_DIRECTION_LABELS } from '@/domain/types'
import { formatMoney } from '@/domain/types/financial'
import {
  evaluateSignal,
  OUTCOME_LABELS,
  OUTCOME_TAG_TYPES,
} from '@/services/advisor-review-calc.service'
import { useAdvisorStore } from '../store'

const store = useAdvisorStore()
defineProps<{
  signals: AdvisorSignal[]
  loading: boolean
}>()
const emit = defineEmits<{ review: [AdvisorSignal] }>()

function statusOf(s: AdvisorSignal): {
  label: string
  type: 'default' | 'success' | 'warning' | 'error'
} {
  const fu = store.getFollowUpFor(s.id)
  if (!fu) return { label: '待复盘', type: 'default' }
  // 已填区间价的，用算法判定 8 状态之一
  if (fu.rangeEndClose != null) {
    const o = evaluateSignal({
      direction: s.direction,
      refPrice: s.refPrice,
      followed: fu.followed,
      hypotheticalQty: s.hypotheticalQty,
      rangeHigh: fu.rangeHigh ?? 0,
      rangeLow: fu.rangeLow ?? 0,
      rangeEndClose: fu.rangeEndClose,
    })
    return { label: OUTCOME_LABELS[o.outcomeType], type: OUTCOME_TAG_TYPES[o.outcomeType] }
  }
  // 没填区间价，只显示是否跟随
  return fu.followed ? { label: '已跟随', type: 'success' } : { label: '未跟随', type: 'default' }
}

/** 可空金额格式化：null/undefined 显示 — */
function moneyOrDash(fen: number | null | undefined): string {
  if (fen == null) return '—'
  return formatMoney(fen)
}

const columns: DataTableColumns<AdvisorSignal> = [
  { title: '老师', key: 'advisor', width: 90 },
  {
    title: '时间',
    key: 'signalAt',
    width: 150,
    render: (r) => new Date(r.signalAt).toLocaleString('zh-CN'),
  },
  {
    title: '标的',
    key: 'asset',
    width: 130,
    render: (r) => `${r.assetCode ?? ''} ${r.assetName ?? ''}`,
  },
  {
    title: '方向',
    key: 'direction',
    width: 90,
    render: (r) => ADVISOR_DIRECTION_LABELS[r.direction],
  },
  { title: '参考价', key: 'refPrice', width: 100, render: (r) => formatMoney(r.refPrice) },
  { title: '目标价', key: 'targetPrice', width: 100, render: (r) => moneyOrDash(r.targetPrice) },
  { title: '止损', key: 'stopLoss', width: 100, render: (r) => moneyOrDash(r.stopLoss) },
  { title: '假设量', key: 'hypotheticalQty', width: 80 },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (r) => {
      const st = statusOf(r)
      return h(NTag, { type: st.type, size: 'small' }, { default: () => st.label })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (r) =>
      h(
        NButton,
        { size: 'small', type: 'primary', ghost: true, onClick: () => emit('review', r) },
        { default: () => '复盘' },
      ),
  },
]
</script>
